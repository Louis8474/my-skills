#!/usr/bin/env python3
"""Extract sheet dimensions, values, types, and formulas from an ODS file."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from ods_common import a1, cell_value, expanded_rows, iter_sheets, parse_xml_from_zip, q, sheet_name


def extract(path: Path) -> list[dict[str, Any]]:
    root = parse_xml_from_zip(path, "content.xml")
    result = []
    for sheet in iter_sheets(root):
        rows_out = []
        for r, row in enumerate(expanded_rows(sheet), start=1):
            cells_out = []
            for c, cell in enumerate(row, start=1):
                if cell.tag != q("table", "table-cell"):
                    continue
                value = cell_value(cell)
                formula = cell.attrib.get(q("table", "formula"))
                value_type = cell.attrib.get(q("office", "value-type"))
                if value not in ("", None) or formula:
                    cells_out.append({"address": a1(r, c), "value": value, "type": value_type, "formula": formula})
            if cells_out:
                rows_out.append({"row": r, "cells": cells_out})
        max_col = max((len(row) for row in expanded_rows(sheet)), default=0)
        result.append(
            {"name": sheet_name(sheet), "rows": len(expanded_rows(sheet)), "columns": max_col, "data": rows_out}
        )
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ods", type=Path)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    data = extract(args.ods)
    if args.json:
        print(json.dumps(data, ensure_ascii=False, indent=2))
        return
    for sheet in data:
        print(f"## {sheet['name']} ({sheet['rows']}x{sheet['columns']})")
        for row in sheet["data"]:
            values = [f"{cell['address']}={cell['formula'] or cell['value']}" for cell in row["cells"]]
            print(", ".join(values))


if __name__ == "__main__":
    main()
