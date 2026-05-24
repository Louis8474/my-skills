#!/usr/bin/env python3
"""Create a minimal ODT file from a JSON document specification."""

from __future__ import annotations

import argparse
import json
import shutil
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

from odt_common import ODT_MIMETYPE, ensure_manifest_entry, media_type_for, pack_dir_as_odt, q, unique_picture_name


def add_paragraph(parent: ET.Element, text: str, style: str = "Body") -> None:
    """Add a text:p element with the given style and text content."""
    paragraph = ET.SubElement(parent, q("text", "p"), {q("text", "style-name"): style})
    paragraph.text = text


def add_heading(parent: ET.Element, text: str, level: int = 1, style: str | None = None) -> None:
    """Add a text:h element with the given outline level and style.

    If *style* is given it overrides the default ``Heading{level}`` style.
    """
    style_name = style or f"Heading{level}"
    heading = ET.SubElement(
        parent, q("text", "h"), {q("text", "outline-level"): str(level), q("text", "style-name"): style_name}
    )
    heading.text = text


def add_list(parent: ET.Element, items: list[str]) -> None:
    """Add a text:list with text:list-item children, each containing a paragraph."""
    list_el = ET.SubElement(parent, q("text", "list"))
    for item in items:
        item_el = ET.SubElement(list_el, q("text", "list-item"))
        add_paragraph(item_el, str(item))


def add_table(parent: ET.Element, rows: list[list[object]], name: str = "Table") -> None:
    """Add a table:table with column declarations, rows, and string-typed cells."""
    table = ET.SubElement(parent, q("table", "table"), {q("table", "name"): name})
    ncols = max((len(row) for row in rows), default=0)
    if ncols:
        column = ET.SubElement(table, q("table", "table-column"))
        if ncols > 1:
            column.set(q("table", "number-columns-repeated"), str(ncols))
    for row in rows:
        row_el = ET.SubElement(table, q("table", "table-row"))
        for cell in row:
            cell_el = ET.SubElement(row_el, q("table", "table-cell"), {q("office", "value-type"): "string"})
            add_paragraph(cell_el, str(cell))


def add_note(parent: ET.Element, text: str, note_class: str = "footnote") -> None:
    """Add a text:note with citation marker and note-body paragraph."""
    note = ET.SubElement(parent, q("text", "note"), {q("text", "note-class"): note_class})
    citation = ET.SubElement(note, q("text", "note-citation"))
    citation.text = "*"
    body = ET.SubElement(note, q("text", "note-body"))
    add_paragraph(body, text)


def add_image(parent: ET.Element, href: str, width: str, height: str) -> None:
    """Add a draw:frame with embedded draw:image, anchored to a paragraph."""
    paragraph = ET.SubElement(parent, q("text", "p"))
    frame = ET.SubElement(
        paragraph,
        q("draw", "frame"),
        {q("text", "anchor-type"): "paragraph", q("svg", "width"): width, q("svg", "height"): height},
    )
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


def build_styles() -> ET.Element:
    """Build office:document-styles with Body, Heading1, Heading2, and A4 page layout."""
    root = ET.Element(q("office", "document-styles"), {q("office", "version"): "1.3"})
    styles = ET.SubElement(root, q("office", "styles"))
    for name, family, size, weight in [
        ("Body", "paragraph", "11pt", "normal"),
        ("Heading1", "paragraph", "18pt", "bold"),
        ("Heading2", "paragraph", "14pt", "bold"),
    ]:
        style = ET.SubElement(styles, q("style", "style"), {q("style", "name"): name, q("style", "family"): family})
        ET.SubElement(
            style, q("style", "text-properties"), {q("fo", "font-size"): size, q("fo", "font-weight"): weight}
        )
    automatic = ET.SubElement(root, q("office", "automatic-styles"))
    layout = ET.SubElement(automatic, q("style", "page-layout"), {q("style", "name"): "A4"})
    ET.SubElement(
        layout,
        q("style", "page-layout-properties"),
        {q("fo", "page-width"): "21cm", q("fo", "page-height"): "29.7cm", q("fo", "margin"): "2cm"},
    )
    masters = ET.SubElement(root, q("office", "master-styles"))
    ET.SubElement(
        masters, q("style", "master-page"), {q("style", "name"): "Standard", q("style", "page-layout-name"): "A4"}
    )
    return root


def build_manifest(entries: list[tuple[str, str]]) -> ET.Element:
    """Build manifest:manifest with root mimetype entry and one file-entry per *entries*."""
    root = ET.Element(q("manifest", "manifest"), {q("manifest", "version"): "1.3"})
    ensure_manifest_entry(root, "/", ODT_MIMETYPE)
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
    parser.add_argument("spec", type=Path, help="JSON spec")
    parser.add_argument("output_odt", type=Path)
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
        (root_dir / "mimetype").write_text(ODT_MIMETYPE)
        manifest_entries = [
            ("content.xml", "text/xml"),
            ("styles.xml", "text/xml"),
            ("meta.xml", "text/xml"),
            ("settings.xml", "text/xml"),
        ]
        existing_media: set[str] = set()

        content = ET.Element(q("office", "document-content"), {q("office", "version"): "1.3"})
        body = ET.SubElement(content, q("office", "body"))
        text = ET.SubElement(body, q("office", "text"))
        if spec.get("title"):
            add_heading(text, str(spec["title"]), 1)
        for block in spec.get("blocks", []):
            kind = block.get("type", "paragraph")
            style = block.get("style")
            if kind == "heading":
                add_heading(text, str(block.get("text", "")), int(block.get("level", 1)), style=style)
            elif kind == "paragraph":
                add_paragraph(text, str(block.get("text", "")), style=style or "Body")
            elif kind == "list":
                add_list(text, [str(item) for item in block.get("items", [])])
            elif kind == "table":
                add_table(text, block.get("rows", []), str(block.get("name", "Table")))
            elif kind == "footnote":
                add_note(text, str(block.get("text", "")))
            elif kind == "image":
                source = Path(block["path"])
                package_path = unique_picture_name(existing_media, source)
                existing_media.add(package_path)
                target = root_dir / package_path
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(source, target)
                manifest_entries.append((package_path, media_type_for(source)))
                add_image(text, package_path, block.get("width", "8cm"), block.get("height", "5cm"))
            else:
                raise SystemExit(f"Unknown block type: {kind}")

        ET.ElementTree(content).write(root_dir / "content.xml", encoding="utf-8", xml_declaration=True)
        ET.ElementTree(build_styles()).write(root_dir / "styles.xml", encoding="utf-8", xml_declaration=True)
        ET.ElementTree(build_meta(spec.get("title"))).write(
            root_dir / "meta.xml", encoding="utf-8", xml_declaration=True
        )
        ET.ElementTree(build_settings()).write(root_dir / "settings.xml", encoding="utf-8", xml_declaration=True)
        ET.ElementTree(build_manifest(manifest_entries)).write(
            root_dir / "META-INF" / "manifest.xml", encoding="utf-8", xml_declaration=True
        )
        pack_dir_as_odt(root_dir, args.output_odt)
    print(args.output_odt)


if __name__ == "__main__":
    main()
