#!/usr/bin/env python3
"""Replace text in ODT XML, optionally scoped to content.xml or styles.xml.

Preserves inline children (text:span, text:note, text:bookmark, text:a) and
handles matches that straddle child element boundaries.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from xml.etree import ElementTree as ET

from odt_common import (
    parse_xml_from_zip,
    q,
    replace_text_in_element,
    update_meta_for_edit,
    write_odt_with_replacements,
    xml_bytes,
)


def replace_in_root(root: ET.Element, old: str, new: str) -> int:
    count = 0
    for node in root.iter():
        if node.tag in {q("text", "p"), q("text", "h")}:
            count += replace_text_in_element(node, old, new)
    return count


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odt", type=Path)
    parser.add_argument("old")
    parser.add_argument("new")
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--scope", choices=["content", "styles", "both"], default="content")
    args = parser.parse_args()

    replacements: dict[str, bytes] = {}
    total = 0
    if args.scope in {"content", "both"}:
        content = parse_xml_from_zip(args.input_odt, "content.xml")
        total += replace_in_root(content, args.old, args.new)
        replacements["content.xml"] = xml_bytes(content)
    if args.scope in {"styles", "both"}:
        styles = parse_xml_from_zip(args.input_odt, "styles.xml")
        total += replace_in_root(styles, args.old, args.new)
        replacements["styles.xml"] = xml_bytes(styles)

    meta = parse_xml_from_zip(args.input_odt, "meta.xml")
    update_meta_for_edit(meta)
    replacements["meta.xml"] = xml_bytes(meta)

    write_odt_with_replacements(args.input_odt, args.output, replacements)
    print(f"replacements: {total}")


if __name__ == "__main__":
    main()
