#!/usr/bin/env python3
"""Create a minimal ODS workbook from a JSON specification."""

from __future__ import annotations

import argparse
import json
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree as ET

from ods_common import ODS_MIMETYPE, ensure_cell, pack_dir_as_ods, parse_a1, q, set_cell_value


def build_styles() -> ET.Element:
    """Build office:document-styles with empty styles and a Default master page."""
    root = ET.Element(q("office", "document-styles"), {q("office", "version"): "1.3"})
    ET.SubElement(root, q("office", "styles"))
    ET.SubElement(root, q("office", "automatic-styles"))
    master = ET.SubElement(root, q("office", "master-styles"))
    ET.SubElement(master, q("style", "master-page"), {q("style", "name"): "Default"})
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


def build_manifest() -> ET.Element:
    """Build manifest:manifest with mimetype and all XML file entries."""
    root = ET.Element(q("manifest", "manifest"), {q("manifest", "version"): "1.3"})
    for full_path, media_type in [
        ("/", ODS_MIMETYPE),
        ("content.xml", "text/xml"),
        ("styles.xml", "text/xml"),
        ("meta.xml", "text/xml"),
        ("settings.xml", "text/xml"),
    ]:
        ET.SubElement(
            root,
            q("manifest", "file-entry"),
            {q("manifest", "full-path"): full_path, q("manifest", "media-type"): media_type},
        )
    return root


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("spec", type=Path, help="JSON workbook spec")
    parser.add_argument("output_ods", type=Path)
    args = parser.parse_args()
    if not args.spec.exists():
        raise SystemExit(f"Spec file not found: {args.spec}")
    try:
        spec = json.loads(args.spec.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SystemExit(f"Invalid JSON in {args.spec}: {exc}")

    content = ET.Element(q("office", "document-content"), {q("office", "version"): "1.3"})
    body = ET.SubElement(content, q("office", "body"))
    spreadsheet = ET.SubElement(body, q("office", "spreadsheet"))
    for sheet_spec in spec.get("sheets", []):
        sheet = ET.SubElement(spreadsheet, q("table", "table"), {q("table", "name"): sheet_spec.get("name", "Sheet1")})
        for r, row_values in enumerate(sheet_spec.get("rows", []), start=1):
            row = ET.SubElement(sheet, q("table", "table-row"))
            for c, value in enumerate(row_values, start=1):
                cell = ET.SubElement(row, q("table", "table-cell"))
                if isinstance(value, dict):
                    if "formula" in value:
                        set_cell_value(cell, str(value["formula"]), formula=True)
                    else:
                        set_cell_value(cell, str(value.get("value", "")))
                else:
                    set_cell_value(cell, str(value))
        for address, value in sheet_spec.get("cells", {}).items():
            _, row_idx, col_idx = parse_a1(address)
            cell = ensure_cell(sheet, row_idx, col_idx)
            if isinstance(value, dict) and "formula" in value:
                set_cell_value(cell, str(value["formula"]), formula=True)
            else:
                set_cell_value(cell, str(value.get("value", value)) if isinstance(value, dict) else str(value))

        # ODF requires table:table-column declarations before any rows.
        table_rows = sheet.findall(q("table", "table-row"))
        ncols = max((len(row.findall(q("table", "table-cell"))) for row in table_rows), default=0)
        if ncols:
            column = ET.Element(q("table", "table-column"))
            if ncols > 1:
                column.set(q("table", "number-columns-repeated"), str(ncols))
            sheet.insert(0, column)

    with tempfile.TemporaryDirectory() as tmp:
        root_dir = Path(tmp)
        (root_dir / "META-INF").mkdir()
        (root_dir / "mimetype").write_text(ODS_MIMETYPE)
        ET.ElementTree(content).write(root_dir / "content.xml", encoding="utf-8", xml_declaration=True)
        ET.ElementTree(build_styles()).write(root_dir / "styles.xml", encoding="utf-8", xml_declaration=True)
        ET.ElementTree(build_meta(spec.get("title"))).write(
            root_dir / "meta.xml", encoding="utf-8", xml_declaration=True
        )
        ET.ElementTree(build_settings()).write(root_dir / "settings.xml", encoding="utf-8", xml_declaration=True)
        ET.ElementTree(build_manifest()).write(
            root_dir / "META-INF" / "manifest.xml", encoding="utf-8", xml_declaration=True
        )
        pack_dir_as_ods(root_dir, args.output_ods)
    print(args.output_ods)


if __name__ == "__main__":
    main()
