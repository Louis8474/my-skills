#!/usr/bin/env python3
"""Create a minimal ODP file from a JSON slide specification."""

from __future__ import annotations

import argparse
import json
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

from odp_common import ODP_MIMETYPE, ensure_manifest_entry, media_type_for, pack_dir_as_odp, q, unique_picture_name


def text_frame(
    parent: ET.Element,
    name: str,
    x: str,
    y: str,
    width: str,
    height: str,
    style: str,
    lines: list[str],
    frame_style: str,
) -> None:
    """Add a draw:frame with draw:text-box containing styled paragraphs.

    *frame_style* names a ``style:family="graphic"`` style — without it the
    frame inherits LibreOffice's default fill and renders as a blue box.
    """
    frame = ET.SubElement(
        parent,
        q("draw", "frame"),
        {
            q("draw", "name"): name,
            q("draw", "style-name"): frame_style,
            q("draw", "layer"): "layout",
            q("svg", "x"): x,
            q("svg", "y"): y,
            q("svg", "width"): width,
            q("svg", "height"): height,
        },
    )
    box = ET.SubElement(frame, q("draw", "text-box"))
    for line in lines:
        paragraph = ET.SubElement(box, q("text", "p"), {q("text", "style-name"): style})
        paragraph.text = line


def image_frame(
    parent: ET.Element,
    href: str,
    x: str,
    y: str,
    width: str,
    height: str,
) -> None:
    """Add a draw:frame with embedded draw:image at the given position."""
    frame = ET.SubElement(
        parent,
        q("draw", "frame"),
        {
            q("draw", "name"): "Image",
            q("svg", "x"): x,
            q("svg", "y"): y,
            q("svg", "width"): width,
            q("svg", "height"): height,
        },
    )
    frame.set(q("draw", "style-name"), "gr-image")
    frame.set(q("draw", "layer"), "layout")
    ET.SubElement(
        frame,
        q("draw", "image"),
        {
            q("xlink", "href"): href,
            q("xlink", "type"): "simple",
            q("xlink", "show"): "embed",
            q("xlink", "actuate"): "onLoad",
        },
    )


# Default presentation theme — light background, accent-blue title, dark body.
BACKGROUND_COLOR = "#FFFFFF"
TITLE_COLOR = "#02416C"
BODY_COLOR = "#1A1A1A"
NOTES_COLOR = "#000000"


def _graphic_style(
    styles: ET.Element,
    name: str,
    vertical_align: str,
    size: str | None = None,
    weight: str | None = None,
    color: str | None = None,
) -> ET.Element:
    """Append a no-fill, no-stroke graphic style and return it.

    A styleless draw:frame inherits LibreOffice's default ``standard`` graphic
    style (a solid #729fcf fill) and renders as a blue box. Every generated
    frame references one of these instead.

    The graphic style also carries the ``style:text-properties`` that style the
    text inside the frame — slide text is styled through the frame's graphic
    style, not through a paragraph ``text:style-name``.
    """
    style = ET.SubElement(
        styles,
        q("style", "style"),
        {q("style", "name"): name, q("style", "family"): "graphic"},
    )
    ET.SubElement(
        style,
        q("style", "graphic-properties"),
        {
            q("draw", "fill"): "none",
            q("draw", "stroke"): "none",
            q("draw", "textarea-vertical-align"): vertical_align,
            q("draw", "auto-grow-height"): "false",
            q("draw", "auto-grow-width"): "false",
        },
    )
    if size or color:
        text_props: dict[str, str] = {}
        if size:
            text_props[q("fo", "font-size")] = size
        if weight:
            text_props[q("fo", "font-weight")] = weight
        if color:
            text_props[q("fo", "color")] = color
        ET.SubElement(style, q("style", "text-properties"), text_props)
    return style


def _paragraph_style(styles: ET.Element, name: str, size: str, weight: str, color: str) -> None:
    """Append a paragraph style carrying an explicit text colour."""
    style = ET.SubElement(styles, q("style", "style"), {q("style", "name"): name, q("style", "family"): "paragraph"})
    if name == "Body":
        ET.SubElement(style, q("style", "paragraph-properties"), {q("fo", "margin-bottom"): "0.35cm"})
    ET.SubElement(
        style,
        q("style", "text-properties"),
        {q("fo", "font-size"): size, q("fo", "font-weight"): weight, q("fo", "color"): color},
    )


def build_styles() -> ET.Element:
    """Build office:document-styles with a designed default presentation theme.

    Emits a ``drawing-page`` background style (referenced by the master page),
    ``graphic`` frame styles that suppress the default fill, and the paragraph
    styles Title/Body/Notes. Names stay stable so injected branded styles and
    customize_master keep working.
    """
    root = ET.Element(q("office", "document-styles"), {q("office", "version"): "1.3"})

    # office:styles — common named styles.
    styles = ET.SubElement(root, q("office", "styles"))

    # Graphic styles — no blue box; the title block is vertically centred.
    # Their text-properties style the text inside each frame.
    _graphic_style(styles, "gr-title", "middle", "40pt", "bold", TITLE_COLOR)
    _graphic_style(styles, "gr-body", "top", "20pt", "normal", BODY_COLOR)
    _graphic_style(styles, "gr-notes", "top", "12pt", "normal", NOTES_COLOR)
    _graphic_style(styles, "gr-image", "middle")

    # Paragraph styles — colours double as a second guarantee of text colour.
    _paragraph_style(styles, "Title", "40pt", "bold", TITLE_COLOR)
    _paragraph_style(styles, "Body", "20pt", "normal", BODY_COLOR)
    _paragraph_style(styles, "Notes", "12pt", "normal", NOTES_COLOR)

    # office:automatic-styles — page layout + the drawing-page background
    # style. A master page's drawing-page style must live here (not in
    # office:styles) for LibreOffice to render the slide background.
    automatic = ET.SubElement(root, q("office", "automatic-styles"))
    layout = ET.SubElement(automatic, q("style", "page-layout"), {q("style", "name"): "Screen"})
    ET.SubElement(
        layout,
        q("style", "page-layout-properties"),
        {
            q("fo", "page-width"): "28cm",
            q("fo", "page-height"): "15.75cm",
            q("style", "print-orientation"): "landscape",
        },
    )
    dp = ET.SubElement(
        automatic,
        q("style", "style"),
        {q("style", "name"): "dp-default", q("style", "family"): "drawing-page"},
    )
    ET.SubElement(
        dp,
        q("style", "drawing-page-properties"),
        {q("draw", "fill"): "solid", q("draw", "fill-color"): BACKGROUND_COLOR},
    )

    # office:master-styles — the master page references the background style.
    master_styles = ET.SubElement(root, q("office", "master-styles"))
    ET.SubElement(
        master_styles,
        q("style", "master-page"),
        {
            q("style", "name"): "Default",
            q("style", "page-layout-name"): "Screen",
            q("draw", "style-name"): "dp-default",
        },
    )
    return root


def build_manifest(entries: list[tuple[str, str]]) -> ET.Element:
    """Build manifest:manifest with root mimetype entry and one file-entry per *entries*."""
    root = ET.Element(q("manifest", "manifest"), {q("manifest", "version"): "1.3"})
    ensure_manifest_entry(root, "/", ODP_MIMETYPE)
    for full_path, media_type in entries:
        ensure_manifest_entry(root, full_path, media_type)
    return root


def build_meta(title: str | None) -> ET.Element:
    """Build office:document-meta with optional dc:title and current UTC creation-date."""
    root = ET.Element(q("office", "document-meta"), {q("office", "version"): "1.3"})
    meta = ET.SubElement(root, q("office", "meta"))
    if title:
        title_el = ET.SubElement(meta, q("dc", "title"))
        title_el.text = title
    created = ET.SubElement(meta, q("meta", "creation-date"))
    created.text = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    return root


def build_settings() -> ET.Element:
    """Build office:document-settings with an empty office:settings element."""
    root = ET.Element(q("office", "document-settings"), {q("office", "version"): "1.3"})
    ET.SubElement(root, q("office", "settings"))
    return root


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("spec", type=Path, help="JSON spec with a slides array")
    parser.add_argument("output_odp", type=Path)
    args = parser.parse_args()

    if not args.spec.exists():
        raise SystemExit(f"Spec file not found: {args.spec}")
    try:
        spec = json.loads(args.spec.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON in {args.spec}: {exc}")
    slides = spec.get("slides", [])
    if not slides:
        raise SystemExit("Spec must contain a non-empty slides array")

    with tempfile.TemporaryDirectory() as tmp:
        root_dir = Path(tmp)
        (root_dir / "META-INF").mkdir()
        (root_dir / "Pictures").mkdir()
        (root_dir / "mimetype").write_text(ODP_MIMETYPE)

        content = ET.Element(q("office", "document-content"), {q("office", "version"): "1.3"})
        body = ET.SubElement(content, q("office", "body"))
        presentation = ET.SubElement(body, q("office", "presentation"))
        manifest_entries = [
            ("content.xml", "text/xml"),
            ("styles.xml", "text/xml"),
            ("meta.xml", "text/xml"),
            ("settings.xml", "text/xml"),
        ]
        existing_media: set[str] = set()

        for index, slide in enumerate(slides, start=1):
            page = ET.SubElement(
                presentation,
                q("draw", "page"),
                {
                    q("draw", "name"): slide.get("name", f"Slide {index}"),
                    q("draw", "master-page-name"): slide.get("master_page", "Default"),
                },
            )
            title = slide.get("title")
            if title:
                text_frame(page, "Title", "1cm", "0.8cm", "26cm", "2cm", "Title", [str(title)], "gr-title")
            body_lines = slide.get("body", [])
            if isinstance(body_lines, str):
                body_lines = [body_lines]
            if body_lines:
                text_frame(
                    page,
                    "Body",
                    "1.4cm",
                    "3.2cm",
                    "25cm",
                    "8cm",
                    "Body",
                    [str(line) for line in body_lines],
                    "gr-body",
                )
            image = slide.get("image")
            if image:
                source = Path(image)
                package_path = unique_picture_name(existing_media, source)
                existing_media.add(package_path)
                target = root_dir / package_path
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, target)
                manifest_entries.append((package_path, media_type_for(source)))
                image_frame(
                    page,
                    package_path,
                    slide.get("image_x", "15cm"),
                    slide.get("image_y", "3cm"),
                    slide.get("image_width", "11cm"),
                    slide.get("image_height", "8cm"),
                )
            notes = slide.get("notes", [])
            if isinstance(notes, str):
                notes = [notes]
            if notes:
                notes_el = ET.SubElement(page, q("presentation", "notes"))
                text_frame(
                    notes_el,
                    "Notes",
                    "1cm",
                    "1cm",
                    "24cm",
                    "10cm",
                    "Notes",
                    [str(line) for line in notes],
                    "gr-notes",
                )

        ET.ElementTree(content).write(root_dir / "content.xml", encoding="utf-8", xml_declaration=True)
        ET.ElementTree(build_styles()).write(root_dir / "styles.xml", encoding="utf-8", xml_declaration=True)
        ET.ElementTree(build_meta(spec.get("title"))).write(
            root_dir / "meta.xml", encoding="utf-8", xml_declaration=True
        )
        ET.ElementTree(build_settings()).write(root_dir / "settings.xml", encoding="utf-8", xml_declaration=True)
        ET.ElementTree(build_manifest(manifest_entries)).write(
            root_dir / "META-INF" / "manifest.xml", encoding="utf-8", xml_declaration=True
        )
        pack_dir_as_odp(root_dir, args.output_odp)
    print(args.output_odp)


if __name__ == "__main__":
    main()
