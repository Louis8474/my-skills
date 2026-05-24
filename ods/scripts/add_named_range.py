#!/usr/bin/env python3
"""Add a named range or named expression to an ODS workbook.

Two modes:
- --range ADDR: emits text:named-range pointing to a cell range
  (e.g. 'Sheet1.B2:B100').
- --expression FORMULA: emits text:named-expression with an arbitrary
  formula or value.

Named ranges and expressions become available across all sheets unless
--scope sheet:NAME restricts them.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from xml.etree import ElementTree as ET

from ods_common import (
    NS,
    parse_xml_from_zip,
    q,
    update_meta_for_edit,
    write_ods_with_replacements,
    xml_bytes,
)


def expand_address(range_str: str) -> str:
    """Convert 'Sheet1.B2:B100' into the ODF '$Sheet1.$B$2:$B$100' canonical form.

    Best-effort: accepts both 'Sheet1.B2:B100' and pre-dollar-quoted forms.
    """
    if range_str.startswith("$"):
        return range_str
    if "." not in range_str:
        return range_str
    sheet, rest = range_str.split(".", 1)
    if ":" in rest:
        start, end = rest.split(":", 1)
        return f"${sheet}.${start.replace('$', '')}:.${end.replace('$', '')}"
    return f"${sheet}.${rest.replace('$', '')}"


def ensure_named_expressions(content_root: ET.Element, parent: ET.Element) -> ET.Element:
    """Locate or create <table:named-expressions> directly under *parent*."""
    decls = parent.find(q("table", "named-expressions"))
    if decls is None:
        # Per ODF spec, table:named-expressions must come after
        # table:content-validations / before any table:database-ranges and
        # before sheets. Pragmatic: insert at the start of the spreadsheet body.
        decls = ET.Element(q("table", "named-expressions"))
        parent.insert(0, decls)
    return decls


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_ods", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--name", required=True, help="identifier (must be unique within scope)")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--range", dest="range_addr", help="cell range like 'Sheet1.B2:B100'")
    group.add_argument("--expression", help="arbitrary formula or value (without leading '=')")
    parser.add_argument(
        "--scope",
        default="global",
        help="'global' (default) or 'sheet:NAME' to restrict the name to one sheet",
    )
    args = parser.parse_args()

    content = parse_xml_from_zip(args.input_ods, "content.xml")
    spreadsheet = content.find(".//office:spreadsheet", NS)
    if spreadsheet is None:
        raise SystemExit("office:spreadsheet not found")

    if args.scope == "global":
        decls = ensure_named_expressions(content, spreadsheet)
    elif args.scope.startswith("sheet:"):
        sheet_name = args.scope[len("sheet:") :]
        target_sheet = None
        for sheet in spreadsheet.findall("table:table", NS):
            if sheet.attrib.get(q("table", "name")) == sheet_name:
                target_sheet = sheet
                break
        if target_sheet is None:
            raise SystemExit(f"scope sheet not found: {sheet_name}")
        decls = ensure_named_expressions(content, target_sheet)
    else:
        raise SystemExit(f"--scope must be 'global' or 'sheet:NAME', got {args.scope!r}")

    # Remove any existing entry with the same name (idempotent re-add).
    for existing in list(decls):
        if existing.attrib.get(q("table", "name")) == args.name:
            decls.remove(existing)

    if args.range_addr is not None:
        el = ET.SubElement(
            decls,
            q("table", "named-range"),
            {
                q("table", "name"): args.name,
                q("table", "cell-range-address"): expand_address(args.range_addr),
                q("table", "base-cell-address"): expand_address(args.range_addr.split(":")[0]),
            },
        )
    else:
        el = ET.SubElement(
            decls,
            q("table", "named-expression"),
            {
                q("table", "name"): args.name,
                q("table", "expression"): args.expression,
            },
        )
    del el  # explicit no-op so attribute-only mutation is clear

    meta = parse_xml_from_zip(args.input_ods, "meta.xml")
    update_meta_for_edit(meta)
    write_ods_with_replacements(
        args.input_ods,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(args.name)


if __name__ == "__main__":
    main()
