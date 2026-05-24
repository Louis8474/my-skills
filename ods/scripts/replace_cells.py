#!/usr/bin/env python3
"""Set ODS cell values or formulas by Sheet!A1 assignments."""

from __future__ import annotations

import argparse
from pathlib import Path

from ods_common import (
    ensure_cell,
    find_sheet,
    parse_a1,
    parse_xml_from_zip,
    set_cell_value,
    update_meta_for_edit,
    write_ods_with_replacements,
    xml_bytes,
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_ods", type=Path)
    parser.add_argument("assignments", nargs="+", help="Sheet!A1=value or Sheet!A1=formula:of:=...")
    parser.add_argument("-o", "--output", type=Path, required=True)
    args = parser.parse_args()
    content = parse_xml_from_zip(args.input_ods, "content.xml")
    count = 0
    for assignment in args.assignments:
        if "=" not in assignment:
            raise SystemExit(f"Assignment must be ADDRESS=value: {assignment}")
        address, value = assignment.split("=", 1)
        sheet_name, row_idx, col_idx = parse_a1(address)
        sheet = find_sheet(content, sheet_name)
        cell = ensure_cell(sheet, row_idx, col_idx)
        if value.startswith("formula:"):
            set_cell_value(cell, value[len("formula:") :], formula=True)
        else:
            set_cell_value(cell, value)
        count += 1
    meta = parse_xml_from_zip(args.input_ods, "meta.xml")
    update_meta_for_edit(meta)
    write_ods_with_replacements(
        args.input_ods,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(f"cells updated: {count}")


if __name__ == "__main__":
    main()
