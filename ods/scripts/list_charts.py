#!/usr/bin/env python3
"""List all embedded chart objects in an ODS workbook as JSON."""

from __future__ import annotations

import argparse
import json
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from ods_common import NS, parse_xml_from_zip, q

CLASS_TO_TYPE: dict[str, str] = {
    "chart:bar": "bar",
    "chart:line": "line",
    "chart:circle": "pie",
    "chart:scatter": "scatter",
}


def collect(ods_path: Path) -> list[dict[str, object]]:
    content = parse_xml_from_zip(ods_path, "content.xml")

    # Build anchor lookup: for each draw:object, which cell/sheet contains it?
    sheets: list[ET.Element] = list(content.findall(".//table:table", NS))
    object_anchors: dict[str, tuple[str, int, int]] = {}
    for sheet in sheets:
        sheet_name = sheet.attrib.get(q("table", "name"), "")
        for row_idx, row in enumerate(sheet.findall("table:table-row", NS), start=1):
            for col_idx, cell in enumerate(row.findall("table:table-cell", NS), start=1):
                for obj in cell.iter(q("draw", "object")):
                    href = obj.attrib.get(q("xlink", "href"), "")
                    target = href.lstrip("./").rstrip("/")
                    if target:
                        object_anchors[target] = (sheet_name, row_idx, col_idx)

    results: list[dict[str, object]] = []
    with zipfile.ZipFile(ods_path) as archive:
        for name in archive.namelist():
            if not name.endswith("/content.xml") or "Object" not in name:
                continue
            object_path = name.rsplit("/", 1)[0]
            try:
                obj_content = ET.fromstring(archive.read(name))
            except ET.ParseError:
                continue
            chart_el = obj_content.find(".//chart:chart", NS)
            if chart_el is None:
                continue
            chart_class = chart_el.attrib.get(q("chart", "class"), "")
            chart_type = CLASS_TO_TYPE.get(chart_class, chart_class)
            title_el = chart_el.find("chart:title/text:p", NS)
            plot_area = chart_el.find("chart:plot-area", NS)
            data_range = plot_area.attrib.get(q("table", "cell-range-address")) if plot_area is not None else None
            anchor = object_anchors.get(object_path)
            results.append(
                {
                    "object_path": object_path,
                    "type": chart_type,
                    "data_range": data_range,
                    "title": title_el.text if title_el is not None else None,
                    "anchor_sheet": anchor[0] if anchor else None,
                    "anchor_row": anchor[1] if anchor else None,
                    "anchor_col": anchor[2] if anchor else None,
                }
            )
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_ods", type=Path)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    data = collect(args.input_ods)
    if args.json:
        print(json.dumps(data, ensure_ascii=False, indent=2))
        return
    for chart in data:
        print(f"[{chart['type']}] {chart['object_path']}: {chart['title'] or '(no title)'}")
        print(f"  data: {chart['data_range']}")
        if chart["anchor_sheet"]:
            print(f"  anchor: {chart['anchor_sheet']}.row{chart['anchor_row']}col{chart['anchor_col']}")


if __name__ == "__main__":
    main()
