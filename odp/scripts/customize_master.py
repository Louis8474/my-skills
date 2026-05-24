#!/usr/bin/env python3
"""Customize an ODP master page: background, header, footer, page numbers, logo.

Operates on styles.xml's <style:master-page> elements. Two modes:
- Mutate in place: pass --master NAME with one or more property flags.
- Clone first: pass --clone-to NEW_NAME plus the property flags; the
  cloned master is then customized.
"""

from __future__ import annotations

import argparse
import copy
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from odp_common import (
    copy_into_package,
    ensure_manifest_entry,
    parse_xml_from_zip,
    q,
    unique_picture_name,
    update_meta_for_edit,
    write_odp_with_replacements,
    xml_bytes,
)


def find_master(styles_root: ET.Element, name: str) -> ET.Element | None:
    for master in styles_root.iter(q("style", "master-page")):
        if master.attrib.get(q("style", "name")) == name:
            return master
    return None


def office_styles_element(styles_root: ET.Element) -> ET.Element:
    """Return the office:styles container, creating it as the first child if absent."""
    office_styles = styles_root.find(q("office", "styles"))
    if office_styles is None:
        office_styles = ET.Element(q("office", "styles"))
        styles_root.insert(0, office_styles)
    return office_styles


def automatic_styles_element(styles_root: ET.Element) -> ET.Element:
    """Return office:automatic-styles, creating it before office:master-styles if absent.

    A master page's drawing-page style must live here — LibreOffice ignores a
    drawing-page style placed in office:styles.
    """
    auto = styles_root.find(q("office", "automatic-styles"))
    if auto is not None:
        return auto
    auto = ET.Element(q("office", "automatic-styles"))
    children = list(styles_root)
    master = styles_root.find(q("office", "master-styles"))
    if master is not None:
        styles_root.insert(children.index(master), auto)
    else:
        styles_root.append(auto)
    return auto


def unique_style_name(styles_root: ET.Element, base: str) -> str:
    """Return *base*, or base-2/base-3/... if already taken by a style:style."""
    existing = {s.attrib.get(q("style", "name")) for s in styles_root.iter(q("style", "style"))}
    if base not in existing:
        return base
    n = 2
    while f"{base}-{n}" in existing:
        n += 1
    return f"{base}-{n}"


def resolve_drawing_page_props(styles_root: ET.Element, master: ET.Element, fresh: bool) -> ET.Element:
    """Return the drawing-page-properties that actually control the slide background.

    A master page's background is governed by the ``drawing-page`` style it
    references via ``draw:style-name`` — properties written straight onto the
    ``style:master-page`` element are ignored by LibreOffice. This locates that
    style (creating one when missing) and returns its drawing-page-properties.

    *fresh* mints a brand-new drawing-page style even if one is referenced —
    used for clones so the original master's background is left untouched.
    """
    auto = automatic_styles_element(styles_root)
    name_attr = q("draw", "style-name")
    dp_name = master.attrib.get(name_attr)
    dp_style: ET.Element | None = None
    if dp_name and not fresh:
        for st in styles_root.iter(q("style", "style")):
            if st.attrib.get(q("style", "name")) == dp_name and st.attrib.get(q("style", "family")) == "drawing-page":
                dp_style = st
                break
    if dp_style is None:
        master_name = master.attrib.get(q("style", "name")) or "master"
        new_name = unique_style_name(styles_root, f"dp-{master_name}")
        dp_style = ET.SubElement(
            auto,
            q("style", "style"),
            {q("style", "name"): new_name, q("style", "family"): "drawing-page"},
        )
        master.set(name_attr, new_name)
    props = dp_style.find(q("style", "drawing-page-properties"))
    if props is None:
        props = ET.SubElement(dp_style, q("style", "drawing-page-properties"))
    return props


def ensure_master_graphic_style(styles_root: ET.Element) -> str:
    """Ensure a no-fill graphic style exists for master frames; return its name.

    Header/footer/page-number/logo frames added to a master would otherwise
    inherit LibreOffice's default fill and render as blue boxes.
    """
    office_styles = office_styles_element(styles_root)
    for st in office_styles.iter(q("style", "style")):
        if st.attrib.get(q("style", "name")) == "gr-master" and st.attrib.get(q("style", "family")) == "graphic":
            return "gr-master"
    style = ET.SubElement(
        office_styles,
        q("style", "style"),
        {q("style", "name"): "gr-master", q("style", "family"): "graphic"},
    )
    ET.SubElement(
        style,
        q("style", "graphic-properties"),
        {q("draw", "fill"): "none", q("draw", "stroke"): "none"},
    )
    return "gr-master"


def apply_background(props: ET.Element, color: str | None, image_path: str | None, fill: str) -> None:
    if color:
        props.set(q("draw", "fill"), "solid")
        props.set(q("draw", "fill-color"), color)
    if image_path:
        props.set(q("draw", "fill"), "bitmap")
        props.set(q("draw", "fill-image-name"), image_path)
        props.set(q("style", "repeat"), fill)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odp", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--master", required=True, help="master-page name to customize")
    parser.add_argument("--clone-to", help="if set, clone the master under this new name first")
    parser.add_argument("--background-color", help="hex color, e.g. #02416C")
    parser.add_argument("--background-image", type=Path, help="local image path to embed")
    parser.add_argument("--background-fill", choices=["bitmap", "tile", "stretch"], default="stretch")
    parser.add_argument("--header", help="header text")
    parser.add_argument("--footer-text", help="footer text")
    parser.add_argument("--page-numbers", choices=["true", "false"], help="visibility of page numbers")
    parser.add_argument("--logo", type=Path, help="logo image path (embedded into Pictures/)")
    args = parser.parse_args()

    styles = parse_xml_from_zip(args.input_odp, "styles.xml")
    master_styles = styles.find(q("office", "master-styles"))
    if master_styles is None:
        raise SystemExit("office:master-styles not found in styles.xml")

    master = find_master(styles, args.master)
    if master is None:
        raise SystemExit(f"master-page {args.master!r} not found")

    if args.clone_to:
        clone = copy.deepcopy(master)
        clone.set(q("style", "name"), args.clone_to)
        master_styles.append(clone)
        target = clone
    else:
        target = master

    # Embed background image / logo into Pictures/ if provided
    new_picture_path: str | None = None
    new_logo_path: str | None = None
    embed_source: Path | None = None
    if args.background_image:
        with zipfile.ZipFile(args.input_odp) as archive:
            existing = set(archive.namelist())
        new_picture_path = unique_picture_name(existing, args.background_image)
        embed_source = args.background_image
    if args.logo:
        with zipfile.ZipFile(args.input_odp) as archive:
            existing = set(archive.namelist())
        new_logo_path = unique_picture_name(existing, args.logo)

    # Apply background — into the drawing-page style the master references,
    # not onto the master element itself (which LibreOffice ignores).
    if args.background_color or new_picture_path:
        props = resolve_drawing_page_props(styles, target, fresh=bool(args.clone_to))
        apply_background(props, args.background_color, new_picture_path, args.background_fill)

    # Header / footer / page numbers / logo as draw:frame children of master.
    # Each carries a no-fill graphic style so it does not render as a blue box.
    needs_frame = args.header or args.footer_text or args.page_numbers == "true" or new_logo_path
    graphic_style = ensure_master_graphic_style(styles) if needs_frame else ""
    if args.header:
        frame = ET.SubElement(
            target,
            q("draw", "frame"),
            {
                q("presentation", "class"): "header",
                q("draw", "name"): "Header",
                q("draw", "style-name"): graphic_style,
            },
        )
        text_box = ET.SubElement(frame, q("draw", "text-box"))
        p = ET.SubElement(text_box, q("text", "p"))
        p.text = args.header
    if args.footer_text:
        frame = ET.SubElement(
            target,
            q("draw", "frame"),
            {
                q("presentation", "class"): "footer",
                q("draw", "name"): "Footer",
                q("draw", "style-name"): graphic_style,
            },
        )
        text_box = ET.SubElement(frame, q("draw", "text-box"))
        p = ET.SubElement(text_box, q("text", "p"))
        p.text = args.footer_text
    if args.page_numbers == "true":
        frame = ET.SubElement(
            target,
            q("draw", "frame"),
            {
                q("presentation", "class"): "page-number",
                q("draw", "name"): "PageNumber",
                q("draw", "style-name"): graphic_style,
            },
        )
        text_box = ET.SubElement(frame, q("draw", "text-box"))
        p = ET.SubElement(text_box, q("text", "p"))
        ET.SubElement(p, q("text", "page-number"))
    if new_logo_path:
        frame = ET.SubElement(
            target,
            q("draw", "frame"),
            {
                q("draw", "name"): "Logo",
                q("draw", "style-name"): graphic_style,
                q("svg", "width"): "3cm",
                q("svg", "height"): "1.2cm",
                q("svg", "x"): "0.5cm",
                q("svg", "y"): "0.5cm",
            },
        )
        ET.SubElement(
            frame,
            q("draw", "image"),
            {
                q("xlink", "href"): new_logo_path,
                q("xlink", "type"): "simple",
                q("xlink", "show"): "embed",
                q("xlink", "actuate"): "onLoad",
            },
        )

    manifest = parse_xml_from_zip(args.input_odp, "META-INF/manifest.xml")
    if new_picture_path:
        ensure_manifest_entry(manifest, new_picture_path, "image/png")
    if new_logo_path:
        ensure_manifest_entry(manifest, new_logo_path, "image/png")

    meta = parse_xml_from_zip(args.input_odp, "meta.xml")
    update_meta_for_edit(meta)

    replacements = {
        "styles.xml": xml_bytes(styles),
        "meta.xml": xml_bytes(meta),
        "META-INF/manifest.xml": xml_bytes(manifest),
    }

    if new_picture_path and embed_source:
        copy_into_package(args.input_odp, args.output, new_picture_path, embed_source, replacements)
    elif new_logo_path and args.logo:
        copy_into_package(args.input_odp, args.output, new_logo_path, args.logo, replacements)
    else:
        write_odp_with_replacements(args.input_odp, args.output, replacements)

    print(args.clone_to or args.master)


if __name__ == "__main__":
    main()
