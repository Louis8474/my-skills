#!/usr/bin/env python3
"""Wrap multiple shapes on an ODG page into a draw:g group container."""

from __future__ import annotations

import argparse
from pathlib import Path
from xml.etree import ElementTree as ET

from odg_common import (
    iter_pages,
    parse_xml_from_zip,
    q,
    update_meta_for_edit,
    write_odg_with_replacements,
    xml_bytes,
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odg", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--shapes", required=True, help="comma-separated list of draw:name targets")
    parser.add_argument("--name", help="draw:name on the group container")
    parser.add_argument("--page", type=int, default=1)
    args = parser.parse_args()

    wanted = [s.strip() for s in args.shapes.split(",") if s.strip()]
    if not wanted:
        raise SystemExit("--shapes must list at least one name")

    content = parse_xml_from_zip(args.input_odg, "content.xml")
    pages = list(iter_pages(content))
    if args.page < 1 or args.page > len(pages):
        raise SystemExit(f"page index out of range: {args.page} (have {len(pages)})")
    page = pages[args.page - 1]

    name_attr = q("draw", "name")
    # Collect direct children of the page whose draw:name matches.
    targets: list[ET.Element] = [child for child in list(page) if child.attrib.get(name_attr) in wanted]
    if not targets:
        raise SystemExit(f"no matching shapes found on page {args.page}")

    # Determine insertion index = position of first matched child.
    insert_index = list(page).index(targets[0])

    # Build the group, detach targets in document order, re-attach inside group.
    group_attribs: dict[str, str] = {}
    if args.name:
        group_attribs[name_attr] = args.name
    group = ET.Element(q("draw", "g"), group_attribs)
    for el in targets:
        page.remove(el)
        group.append(el)
    page.insert(insert_index, group)

    meta = parse_xml_from_zip(args.input_odg, "meta.xml")
    update_meta_for_edit(meta)
    write_odg_with_replacements(
        args.input_odg,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(args.name or f"group({len(targets)})")


if __name__ == "__main__":
    main()
