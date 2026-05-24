#!/usr/bin/env python3
"""Replace text labels in an ODG file.

Preserves inline children (text:span, text:a) and handles matches that straddle
child element boundaries.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from odg_common import (
    NS,
    parse_xml_from_zip,
    replace_text_in_element,
    update_meta_for_edit,
    write_odg_with_replacements,
    xml_bytes,
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odg", type=Path)
    parser.add_argument("old")
    parser.add_argument("new")
    parser.add_argument("-o", "--output", type=Path, required=True)
    args = parser.parse_args()
    content = parse_xml_from_zip(args.input_odg, "content.xml")
    count = 0
    for paragraph in content.findall(".//text:p", NS):
        count += replace_text_in_element(paragraph, args.old, args.new)
    meta = parse_xml_from_zip(args.input_odg, "meta.xml")
    update_meta_for_edit(meta)
    write_odg_with_replacements(
        args.input_odg,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(f"replacements: {count}")


if __name__ == "__main__":
    main()
