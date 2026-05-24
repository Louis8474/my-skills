#!/usr/bin/env python3
"""Extract formulas from an ODS file by sheet and A1 address."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from ods_common import a1, cell_value, expanded_rows, iter_sheets, parse_xml_from_zip, q, sheet_name


def extract(path: Path) -> list[dict[str, object]]:
    root = parse_xml_from_zip(path, "content.xml")
    formulas = []
    for sheet in iter_sheets(root):
        name = sheet_name(sheet)
        for r, row in enumerate(expanded_rows(sheet), start=1):
            for c, cell in enumerate(row, start=1):
                formula = cell.attrib.get(q("table", "formula"))
                if formula:
                    formulas.append({"sheet": name, "address": a1(r, c), "formula": formula, "value": cell_value(cell)})
    return formulas


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ods", type=Path)
    args = parser.parse_args()
    print(json.dumps(extract(args.ods), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
