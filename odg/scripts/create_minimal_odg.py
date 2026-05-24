#!/usr/bin/env python3
"""Create a minimal ODG drawing from a JSON specification."""

from __future__ import annotations

import argparse
import json
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

from odg_common import (
    GRAPHIC_KEYS,
    ODG_MIMETYPE,
    TEXT_KEYS,
    build_shape_style,
    build_text_styles,
    ensure_manifest_entry,
    media_type_for,
    pack_dir_as_odg,
    q,
    unique_picture_name,
)

# Default drawing theme — a designed look, not LibreOffice's generic blue.
SHAPE_FILL = "#DCE6F0"  # light accent fill for boxes/ellipses
ACCENT = "#02416C"  # stroke and accent colour
SHAPE_TEXT = "#1A1A1A"  # dark, readable shape text
PAGE_BACKGROUND = "#FFFFFF"


def resolve_styles(item: dict[str, object], role: str, auto_styles: ET.Element) -> tuple[str, str | None, str | None]:
    """Resolve (graphic_style, paragraph_style, text_style) names for *item*.

    With no styling keys the shared *role* style is used and no text styles are
    needed. ``fill``/``stroke``/``stroke-width`` go into a per-shape graphic
    style; ``text-color``/``font-size`` need a paragraph + text style (a graphic
    style's text-properties are ignored from an automatic style in content.xml).
    """
    graphic_overrides = {k: str(item[k]) for k in GRAPHIC_KEYS if item.get(k) is not None}
    text_overrides = {k: str(item[k]) for k in TEXT_KEYS if item.get(k) is not None}
    shape_style = build_shape_style(auto_styles, role, graphic_overrides) if graphic_overrides else role
    if text_overrides:
        p_style, t_style = build_text_styles(auto_styles, text_overrides)
        return shape_style, p_style, t_style
    return shape_style, None, None


def _emit_text(parent: ET.Element, text: str, p_style: str | None, t_style: str | None) -> None:
    """Append a text:p (optionally styled) to *parent*, wrapping in a span when styled."""
    paragraph = ET.SubElement(parent, q("text", "p"))
    if p_style:
        paragraph.set(q("text", "style-name"), p_style)
    if t_style:
        span = ET.SubElement(paragraph, q("text", "span"), {q("text", "style-name"): t_style})
        span.text = text
    else:
        paragraph.text = text


def add_text(page: ET.Element, item: dict[str, object], auto_styles: ET.Element) -> None:
    """Add a draw:frame with draw:text-box containing a single text:p."""
    shape_style, p_style, t_style = resolve_styles(item, "gr-text", auto_styles)
    frame = ET.SubElement(
        page,
        q("draw", "frame"),
        {
            q("draw", "name"): str(item.get("name", "Text")),
            q("draw", "style-name"): shape_style,
            q("draw", "layer"): "layout",
            q("svg", "x"): str(item.get("x", "1cm")),
            q("svg", "y"): str(item.get("y", "1cm")),
            q("svg", "width"): str(item.get("width", "8cm")),
            q("svg", "height"): str(item.get("height", "2cm")),
        },
    )
    box = ET.SubElement(frame, q("draw", "text-box"))
    _emit_text(box, str(item.get("text", "")), p_style, t_style)


def add_shape(page: ET.Element, item: dict[str, object], auto_styles: ET.Element) -> None:
    """Add a draw:rect, draw:ellipse, draw:line, or draw:connector with optional text."""
    shape_type = str(item.get("type", "rect"))
    if shape_type not in {"rect", "ellipse", "line", "connector"}:
        raise SystemExit(f"Unsupported shape type: {shape_type}")
    role = "gr-line" if shape_type in {"line", "connector"} else "gr-shape"
    shape_style, p_style, t_style = resolve_styles(item, role, auto_styles)
    attrs = {
        q("draw", "name"): str(item.get("name", shape_type)),
        q("draw", "style-name"): shape_style,
        q("draw", "layer"): "layout",
    }
    if shape_type in {"line", "connector"}:
        for key, default in [("x1", "1cm"), ("y1", "1cm"), ("x2", "5cm"), ("y2", "1cm")]:
            attrs[q("svg", key)] = str(item.get(key, default))
    else:
        for key, default in [("x", "1cm"), ("y", "1cm"), ("width", "4cm"), ("height", "2cm")]:
            attrs[q("svg", key)] = str(item.get(key, default))
    if shape_type == "rect" and item.get("corner-radius") is not None:
        attrs[q("draw", "corner-radius")] = str(item["corner-radius"])
    shape = ET.SubElement(page, q("draw", shape_type), attrs)
    text = item.get("text")
    if text:
        _emit_text(shape, str(text), p_style, t_style)


def add_image(
    page: ET.Element,
    item: dict[str, object],
    root_dir: Path,
    manifest_entries: list[tuple[str, str]],
    existing: set[str],
) -> None:
    """Copy an image into the package, register it in the manifest, and add a draw:frame."""
    source = Path(str(item["path"]))
    package_path = unique_picture_name(existing, source)
    existing.add(package_path)
    target = root_dir / package_path
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source, target)
    manifest_entries.append((package_path, media_type_for(source)))
    frame = ET.SubElement(
        page,
        q("draw", "frame"),
        {
            q("draw", "name"): str(item.get("name", "Image")),
            q("draw", "style-name"): "gr-image",
            q("draw", "layer"): "layout",
            q("svg", "x"): str(item.get("x", "1cm")),
            q("svg", "y"): str(item.get("y", "1cm")),
            q("svg", "width"): str(item.get("width", "6cm")),
            q("svg", "height"): str(item.get("height", "4cm")),
        },
    )
    ET.SubElement(
        frame,
        q("draw", "image"),
        {
            q("xlink", "href"): package_path,
            q("xlink", "type"): "simple",
            q("xlink", "show"): "embed",
            q("xlink", "actuate"): "onLoad",
        },
    )


def _role_style(styles: ET.Element, name: str, graphic_props: dict[str, str]) -> None:
    """Append a role graphic style parented to ``standard``."""
    style = ET.SubElement(
        styles,
        q("style", "style"),
        {q("style", "name"): name, q("style", "family"): "graphic", q("style", "parent-style-name"): "standard"},
    )
    ET.SubElement(style, q("style", "graphic-properties"), graphic_props)


def build_styles() -> ET.Element:
    """Build office:document-styles with a designed default drawing theme.

    Emits a designed ``standard`` graphic style (the graphic-family default —
    so even a styleless shape inherits something sensible, not LibreOffice's
    generic blue), role styles for shapes/text/lines/images, and a
    ``drawing-page`` background style referenced by the master page.
    """
    root = ET.Element(q("office", "document-styles"), {q("office", "version"): "1.3"})

    # office:styles — common named styles.
    styles = ET.SubElement(root, q("office", "styles"))

    # The graphic-family default. Named "standard" because LibreOffice treats
    # that name as the family default — a styleless shape inherits this.
    standard = ET.SubElement(
        styles, q("style", "style"), {q("style", "name"): "standard", q("style", "family"): "graphic"}
    )
    ET.SubElement(
        standard,
        q("style", "graphic-properties"),
        {
            q("draw", "fill"): "solid",
            q("draw", "fill-color"): SHAPE_FILL,
            q("draw", "stroke"): "solid",
            q("svg", "stroke-color"): ACCENT,
            q("svg", "stroke-width"): "0.03cm",
            q("draw", "textarea-horizontal-align"): "center",
            q("draw", "textarea-vertical-align"): "middle",
            q("fo", "padding"): "0.15cm",
        },
    )
    ET.SubElement(
        standard,
        q("style", "text-properties"),
        {q("fo", "color"): SHAPE_TEXT, q("fo", "font-size"): "16pt"},
    )

    # Role styles — referenced by every generated shape so none falls back to
    # the bare application default.
    _role_style(styles, "gr-shape", {})
    _role_style(
        styles,
        "gr-text",
        {q("draw", "fill"): "none", q("draw", "stroke"): "none", q("draw", "textarea-horizontal-align"): "left"},
    )
    _role_style(styles, "gr-line", {q("draw", "fill"): "none"})
    _role_style(styles, "gr-image", {q("draw", "fill"): "none", q("draw", "stroke"): "none"})

    # office:automatic-styles — page layout + the drawing-page background
    # style. A master page's drawing-page style must live here (not in
    # office:styles) for LibreOffice to render the page background.
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
        {q("draw", "fill"): "solid", q("draw", "fill-color"): PAGE_BACKGROUND},
    )

    # office:master-styles — the master references the background style.
    masters = ET.SubElement(root, q("office", "master-styles"))
    ET.SubElement(
        masters,
        q("style", "master-page"),
        {
            q("style", "name"): "Default",
            q("style", "page-layout-name"): "Screen",
            q("draw", "style-name"): "dp-default",
        },
    )
    return root


def simple_doc(root_name: str) -> ET.Element:
    """Create a minimal office:* root element with version 1.3 attribute."""
    return ET.Element(q("office", root_name), {q("office", "version"): "1.3"})


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("spec", type=Path)
    parser.add_argument("output_odg", type=Path)
    args = parser.parse_args()
    if not args.spec.exists():
        raise SystemExit(f"Spec file not found: {args.spec}")
    try:
        spec = json.loads(args.spec.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON in {args.spec}: {exc}")
    with tempfile.TemporaryDirectory() as tmp:
        root_dir = Path(tmp)
        (root_dir / "META-INF").mkdir()
        (root_dir / "Pictures").mkdir()
        (root_dir / "mimetype").write_text(ODG_MIMETYPE)
        content = ET.Element(q("office", "document-content"), {q("office", "version"): "1.3"})
        # Per-shape automatic graphic styles live here.
        auto_styles = ET.SubElement(content, q("office", "automatic-styles"))
        body = ET.SubElement(content, q("office", "body"))
        drawing = ET.SubElement(body, q("office", "drawing"))
        manifest_entries = [
            ("content.xml", "text/xml"),
            ("styles.xml", "text/xml"),
            ("meta.xml", "text/xml"),
            ("settings.xml", "text/xml"),
        ]
        existing_media: set[str] = set()
        for idx, page_spec in enumerate(spec.get("pages", []), start=1):
            page = ET.SubElement(
                drawing,
                q("draw", "page"),
                {q("draw", "name"): page_spec.get("name", f"Page {idx}"), q("draw", "master-page-name"): "Default"},
            )
            for item in page_spec.get("items", []):
                kind = item.get("type", "text")
                if kind == "text":
                    add_text(page, item, auto_styles)
                elif kind in {"rect", "ellipse", "line", "connector"}:
                    add_shape(page, item, auto_styles)
                elif kind == "image":
                    add_image(page, item, root_dir, manifest_entries, existing_media)
                else:
                    raise SystemExit(f"Unknown item type: {kind}")
        if not list(drawing):
            ET.SubElement(
                drawing, q("draw", "page"), {q("draw", "name"): "Page 1", q("draw", "master-page-name"): "Default"}
            )
        meta = simple_doc("document-meta")
        meta_body = ET.SubElement(meta, q("office", "meta"))
        created = ET.SubElement(meta_body, q("meta", "creation-date"))
        created.text = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
        settings = simple_doc("document-settings")
        ET.SubElement(settings, q("office", "settings"))
        manifest = ET.Element(q("manifest", "manifest"), {q("manifest", "version"): "1.3"})
        ensure_manifest_entry(manifest, "/", ODG_MIMETYPE)
        for full_path, media_type in manifest_entries:
            ensure_manifest_entry(manifest, full_path, media_type)
        ET.ElementTree(content).write(root_dir / "content.xml", encoding="utf-8", xml_declaration=True)
        ET.ElementTree(build_styles()).write(root_dir / "styles.xml", encoding="utf-8", xml_declaration=True)
        ET.ElementTree(meta).write(root_dir / "meta.xml", encoding="utf-8", xml_declaration=True)
        ET.ElementTree(settings).write(root_dir / "settings.xml", encoding="utf-8", xml_declaration=True)
        ET.ElementTree(manifest).write(root_dir / "META-INF" / "manifest.xml", encoding="utf-8", xml_declaration=True)
        pack_dir_as_odg(root_dir, args.output_odg)
    print(args.output_odg)


if __name__ == "__main__":
    main()
