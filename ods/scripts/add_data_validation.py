#!/usr/bin/env python3
"""Add a data-validation rule to an ODS workbook and apply it to a cell range.

Types:
- list   : dropdown of allowed values (--values 'A,B,C')
- number : numeric condition (--condition 'value > 0')
- date   : date condition  (--condition 'cell-content-is-between(2024-01-01,2026-12-31)')
- text   : text-length condition (--condition 'cell-content-text-length() > 0')
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path
from xml.etree import ElementTree as ET

from ods_common import (
    NS,
    col_to_index,
    ensure_cell,
    find_sheet,
    parse_xml_from_zip,
    q,
    update_meta_for_edit,
    write_ods_with_replacements,
    xml_bytes,
)

RANGE_RE = re.compile(r"^([^.!]+)[.!]([A-Za-z]+\d+)(?::([A-Za-z]+\d+))?$")


CELL_RE = re.compile(r"^\$?([A-Za-z]+)\$?(\d+)$")


def _parse_cell(cell: str) -> tuple[int, int]:
    """Parse a bare 'A1' or '$A$1' into (row, col), both 1-based."""
    match = CELL_RE.fullmatch(cell)
    if not match:
        raise SystemExit(f"Invalid cell address: {cell!r}")
    return int(match.group(2)), col_to_index(match.group(1))


def parse_range(range_str: str) -> tuple[str, int, int, int, int]:
    """Parse 'Sheet.A1:C10' → (sheet, row1, col1, row2, col2). Single cell allowed."""
    match = RANGE_RE.fullmatch(range_str)
    if not match:
        raise SystemExit(f"Invalid range: {range_str!r}; expected 'Sheet.A1:C10' or 'Sheet.A1'")
    sheet, start, end = match.groups()
    row1, col1 = _parse_cell(start)
    if end is None:
        return sheet, row1, col1, row1, col1
    row2, col2 = _parse_cell(end)
    return sheet, row1, col1, row2, col2


def ensure_content_validations(content_root: ET.Element) -> ET.Element:
    """Locate or create <table:content-validations> directly under office:spreadsheet."""
    spreadsheet = content_root.find(".//office:spreadsheet", NS)
    if spreadsheet is None:
        raise SystemExit("office:spreadsheet not found")
    decls = spreadsheet.find(q("table", "content-validations"))
    if decls is None:
        # Insert at the start of the spreadsheet body.
        decls = ET.Element(q("table", "content-validations"))
        spreadsheet.insert(0, decls)
    return decls


def build_validation(
    name: str,
    type_: str,
    condition: str | None,
    values: str | None,
    message: str | None,
    error_message: str | None,
) -> ET.Element:
    """Build the <table:content-validation> element."""
    attribs: dict[str, str] = {q("table", "name"): name}
    if type_ == "list":
        if not values:
            raise SystemExit("--type list requires --values")
        items = [v.strip() for v in values.split(",") if v.strip()]
        quote = '"'
        backslash_quote = '\\"'
        quoted = [quote + v.replace(quote, backslash_quote) + quote for v in items]
        attribs[q("table", "condition")] = "of:cell-content-is-in-list(" + ";".join(quoted) + ")"
        attribs[q("table", "allow-empty-cell")] = "true"
        attribs[q("table", "display-list")] = "unsorted"
    else:
        if not condition:
            raise SystemExit(f"--type {type_} requires --condition")
        attribs[q("table", "condition")] = f"of:{condition}" if not condition.startswith("of:") else condition
        attribs[q("table", "allow-empty-cell")] = "true"
        attribs[q("table", "base-cell-address")] = "$A$1"
    el = ET.Element(q("table", "content-validation"), attribs)
    if message:
        help_el = ET.SubElement(
            el,
            q("table", "help-message"),
            {q("table", "display"): "true"},
        )
        p = ET.SubElement(help_el, q("text", "p"))
        p.text = message
    if error_message:
        err_el = ET.SubElement(
            el,
            q("table", "error-message"),
            {q("table", "display"): "true", q("table", "message-type"): "stop"},
        )
        p = ET.SubElement(err_el, q("text", "p"))
        p.text = error_message
    return el


def apply_validation_to_range(
    content_root: ET.Element,
    sheet_name: str,
    row1: int,
    col1: int,
    row2: int,
    col2: int,
    validation_name: str,
) -> int:
    """Set table:content-validation-name on each cell in the rectangular range."""
    sheet = find_sheet(content_root, sheet_name)
    count = 0
    for row in range(row1, row2 + 1):
        for col in range(col1, col2 + 1):
            cell = ensure_cell(sheet, row, col)
            cell.set(q("table", "content-validation-name"), validation_name)
            count += 1
    return count


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_ods", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--name", required=True, help="validation identifier")
    parser.add_argument("--type", required=True, choices=["list", "number", "date", "text"])
    parser.add_argument("--values", help="(--type list) comma-separated allowed values")
    parser.add_argument("--condition", help="(--type number|date|text) ODF condition expression")
    parser.add_argument("--apply", required=True, help="cell range like 'Sheet1.D2:D100'")
    parser.add_argument("--message", help="help message shown on cell focus")
    parser.add_argument("--error-message", help="error shown on validation failure")
    args = parser.parse_args()

    content = parse_xml_from_zip(args.input_ods, "content.xml")
    decls = ensure_content_validations(content)

    # Idempotent: remove existing with same name
    for existing in list(decls):
        if existing.attrib.get(q("table", "name")) == args.name:
            decls.remove(existing)

    validation = build_validation(args.name, args.type, args.condition, args.values, args.message, args.error_message)
    decls.append(validation)

    sheet_name, row1, col1, row2, col2 = parse_range(args.apply)
    cell_count = apply_validation_to_range(content, sheet_name, row1, col1, row2, col2, args.name)

    meta = parse_xml_from_zip(args.input_ods, "meta.xml")
    update_meta_for_edit(meta)
    write_ods_with_replacements(
        args.input_ods,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(f"validation {args.name!r} applied to {cell_count} cells")


if __name__ == "__main__":
    main()
