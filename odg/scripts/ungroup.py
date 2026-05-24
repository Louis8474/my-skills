#!/usr/bin/env python3
"""Ungroup one or all draw:g containers on an ODG page.

Extracts the group's children into the parent (the page) and removes the
container. Preserves document order.
"""

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
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--name", help="draw:name of the group to dissolve")
    group.add_argument("--all", action="store_true", help="dissolve every group on the page")
    parser.add_argument("--page", type=int, default=1)
    args = parser.parse_args()

    content = parse_xml_from_zip(args.input_odg, "content.xml")
    pages = list(iter_pages(content))
    if args.page < 1 or args.page > len(pages):
        raise SystemExit(f"page index out of range: {args.page} (have {len(pages)})")
    page = pages[args.page - 1]

    name_attr = q("draw", "name")
    group_tag = q("draw", "g")
    groups: list[ET.Element] = [c for c in list(page) if c.tag == group_tag]
    if args.name:
        groups = [g for g in groups if g.attrib.get(name_attr) == args.name]
    if not groups:
        raise SystemExit("no matching groups found")

    dissolved = 0
    for grp in groups:
        idx = list(page).index(grp)
        children = list(grp)
        for offset, child in enumerate(children):
            grp.remove(child)
            page.insert(idx + offset, child)
        # Now the group is between index (idx + len) and follows the inserted children.
        page.remove(grp)
        dissolved += 1

    meta = parse_xml_from_zip(args.input_odg, "meta.xml")
    update_meta_for_edit(meta)
    write_odg_with_replacements(
        args.input_odg,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(f"dissolved {dissolved} group(s)")


if __name__ == "__main__":
    main()
