#!/usr/bin/env python3
"""List all named ranges and named expressions in an ODS workbook as JSON."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from xml.etree import ElementTree as ET

from ods_common import NS, parse_xml_from_zip, q


def collect(content_root: ET.Element) -> list[dict[str, object]]:
    spreadsheet = content_root.find(".//office:spreadsheet", NS)
    if spreadsheet is None:
        raise SystemExit("office:spreadsheet not found")

    results: list[dict[str, object]] = []
    # Global named expressions are direct children of office:spreadsheet.
    for decls in spreadsheet.findall("table:named-expressions", NS):
        for child in decls:
            results.append(_entry(child, "global"))
    # Sheet-scoped named expressions are children of individual sheets.
    for sheet in spreadsheet.findall("table:table", NS):
        sheet_name = sheet.attrib.get(q("table", "name"), "")
        for decls in sheet.findall("table:named-expressions", NS):
            for child in decls:
                results.append(_entry(child, f"sheet:{sheet_name}"))
    return results


def _entry(child: ET.Element, scope: str) -> dict[str, object]:
    if child.tag == q("table", "named-range"):
        return {
            "name": child.attrib.get(q("table", "name")),
            "kind": "range",
            "expression": child.attrib.get(q("table", "cell-range-address")),
            "scope": scope,
        }
    if child.tag == q("table", "named-expression"):
        return {
            "name": child.attrib.get(q("table", "name")),
            "kind": "expression",
            "expression": child.attrib.get(q("table", "expression")),
            "scope": scope,
        }
    return {"name": None, "kind": "unknown", "expression": None, "scope": scope}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_ods", type=Path)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    content = parse_xml_from_zip(args.input_ods, "content.xml")
    data = collect(content)
    if args.json:
        print(json.dumps(data, ensure_ascii=False, indent=2))
        return
    for entry in data:
        print(f"[{entry['scope']}] {entry['name']} ({entry['kind']}) = {entry['expression']}")


if __name__ == "__main__":
    main()
