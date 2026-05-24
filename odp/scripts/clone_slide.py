#!/usr/bin/env python3
"""Clone a slide in an ODP file and optionally replace placeholder text."""

from __future__ import annotations

import argparse
from pathlib import Path

from odp_common import (
    NS,
    copy_slide,
    parse_xml_from_zip,
    q,
    select_slide,
    update_meta_for_edit,
    write_odp_with_replacements,
    xml_bytes,
)


def apply_replacements(page, replacements: list[str]) -> None:
    pairs = []
    for item in replacements:
        if "=" not in item:
            raise SystemExit(f"Replacement must be OLD=NEW: {item}")
        pairs.append(item.split("=", 1))
    for paragraph in page.findall(".//text:p", NS):
        if paragraph.text:
            for old, new in pairs:
                paragraph.text = paragraph.text.replace(old, new)
        for node in paragraph.iter():
            if node.text:
                for old, new in pairs:
                    node.text = node.text.replace(old, new)
            if node.tail:
                for old, new in pairs:
                    node.tail = node.tail.replace(old, new)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odp", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--source-slide", default="1", help="slide index (1-based) or draw:name")
    parser.add_argument("--name", help="draw:name for cloned slide")
    parser.add_argument("--replace", action="append", default=[], help="placeholder replacement OLD=NEW; repeatable")
    args = parser.parse_args()

    content = parse_xml_from_zip(args.input_odp, "content.xml")
    source = select_slide(content, args.source_slide)
    clone = copy_slide(source)
    if args.name:
        clone.set(q("draw", "name"), args.name)
    apply_replacements(clone, args.replace)

    presentation = content.find(".//office:presentation", NS)
    if presentation is None:
        raise SystemExit("office:presentation not found")
    presentation.append(clone)

    meta = parse_xml_from_zip(args.input_odp, "meta.xml")
    update_meta_for_edit(meta)
    write_odp_with_replacements(
        args.input_odp,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(args.output)


if __name__ == "__main__":
    main()
