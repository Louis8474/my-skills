#!/usr/bin/env python3
"""Embed a chart object (bar/line/pie/scatter) into an ODS workbook.

Charts are embedded as ``Object N/`` sub-packages with MIME
``application/vnd.oasis.opendocument.chart``. The main content.xml gains a
``draw:frame`` containing ``draw:object xlink:href="./Object N/"`` anchored
to the cell given by ``--cell``.
"""

from __future__ import annotations

import argparse
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from ods_common import (
    build_chart_content,
    col_to_index,
    copy_with_multiple_members,
    ensure_manifest_entry,
    find_sheet,
    parse_xml_from_zip,
    q,
    unique_object_name,
    update_meta_for_edit,
    xml_bytes,
)

CHART_MIMETYPE = "application/vnd.oasis.opendocument.chart"

RANGE_RE = re.compile(r"^([^.!]+)[.!]([A-Za-z]+\d+)(?::([A-Za-z]+\d+))?$")
CELL_RE = re.compile(r"^([^.!]+)[.!]([A-Za-z]+)(\d+)$")


def to_canonical_range(range_str: str) -> str:
    """Convert 'Sheet.A1:B10' to ODF canonical '$Sheet.$A$1:.$B$10'."""
    m = RANGE_RE.fullmatch(range_str)
    if not m:
        raise SystemExit(f"invalid data range {range_str!r}; expected 'Sheet.A1:B10'")
    sheet, start, end = m.groups()
    if end is None:
        return f"${sheet}.${start.replace('$', '')}"
    return f"${sheet}.${start.replace('$', '')}:.${end.replace('$', '')}"


def parse_cell_anchor(cell_str: str) -> tuple[str, int, int]:
    """Parse 'Sheet1.D1' → (sheet, row_1based, col_1based)."""
    m = CELL_RE.fullmatch(cell_str)
    if not m:
        raise SystemExit(f"invalid cell address {cell_str!r}; expected 'Sheet.A1'")
    sheet, col_letters, row = m.groups()
    return sheet, int(row), col_to_index(col_letters)


def build_object_frame(object_path: str, width: str, height: str, cell_sheet: str) -> ET.Element:
    """Build <draw:frame><draw:object xlink:href="./Object N/"/></draw:frame>."""
    frame = ET.Element(
        q("draw", "frame"),
        {
            q("draw", "name"): object_path,
            q("svg", "width"): width,
            q("svg", "height"): height,
            q("svg", "x"): "0cm",
            q("svg", "y"): "0cm",
        },
    )
    ET.SubElement(
        frame,
        q("draw", "object"),
        {
            q("xlink", "href"): f"./{object_path}/",
            q("xlink", "type"): "simple",
            q("xlink", "show"): "embed",
            q("xlink", "actuate"): "onLoad",
        },
    )
    return frame


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_ods", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--type", required=True, choices=["bar", "line", "pie", "scatter"])
    parser.add_argument("--data", required=True, help="data range, e.g. 'Sheet1.A1:B10'")
    parser.add_argument("--cell", required=True, help="anchor cell, e.g. 'Sheet1.D1'")
    parser.add_argument("--title", help="chart title")
    parser.add_argument("--x-label", help="x-axis label (ignored for pie)")
    parser.add_argument("--y-label", help="y-axis label (ignored for pie)")
    parser.add_argument("--width", default="10cm")
    parser.add_argument("--height", default="7cm")
    args = parser.parse_args()

    sheet_name, row, col = parse_cell_anchor(args.cell)
    data_range = to_canonical_range(args.data)
    chart_xml = build_chart_content(args.type, data_range, args.title, args.x_label, args.y_label)

    with zipfile.ZipFile(args.input_ods) as archive:
        existing = set(archive.namelist())
    object_path = unique_object_name(existing)

    content = parse_xml_from_zip(args.input_ods, "content.xml")
    manifest = parse_xml_from_zip(args.input_ods, "META-INF/manifest.xml")
    sheet = find_sheet(content, sheet_name)

    # Locate or create the anchor row + cell, then attach the frame inside.
    from ods_common import ensure_cell  # local import to avoid lib-cycle confusion

    cell = ensure_cell(sheet, row, col)
    frame = build_object_frame(object_path, args.width, args.height, sheet_name)
    cell.append(frame)

    ensure_manifest_entry(manifest, f"{object_path}/", CHART_MIMETYPE)
    ensure_manifest_entry(manifest, f"{object_path}/content.xml", "text/xml")

    meta = parse_xml_from_zip(args.input_ods, "meta.xml")
    update_meta_for_edit(meta)

    copy_with_multiple_members(
        args.input_ods,
        args.output,
        new_members={f"{object_path}/content.xml": chart_xml},
        replacements={
            "content.xml": xml_bytes(content),
            "META-INF/manifest.xml": xml_bytes(manifest),
            "meta.xml": xml_bytes(meta),
        },
    )
    print(object_path)


if __name__ == "__main__":
    main()
