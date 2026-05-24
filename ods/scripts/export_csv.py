#!/usr/bin/env python3
"""Export an ODS sheet to CSV by parsing content.xml."""

from __future__ import annotations

import argparse
from pathlib import Path

from ods_common import cell_value, expanded_rows, find_sheet, parse_xml_from_zip, write_csv


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ods", type=Path)
    parser.add_argument("--sheet", default="")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    content = parse_xml_from_zip(args.ods, "content.xml")
    sheet = find_sheet(content, args.sheet)
    rows = [[cell_value(cell) for cell in row] for row in expanded_rows(sheet)]
    write_csv(args.output, rows)
    print(args.output)


if __name__ == "__main__":
    main()
