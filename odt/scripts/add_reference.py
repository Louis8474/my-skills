#!/usr/bin/env python3
"""Insert reference marks or references-TO into an ODT.

Modes:
- --mark NAME --anchor TEXT          : text:reference-mark (point) after anchor
- --mark-range NAME --start-anchor S --end-anchor E
                                     : text:reference-mark-start/end (intra-paragraph)
- --ref-to NAME --kind bookmark      : text:bookmark-ref pointing to a text:bookmark
       --anchor TEXT [--display MODE]
- --ref-to NAME --kind reference     : text:reference-ref pointing to a text:reference-mark
       --anchor TEXT [--display MODE]

--display values: page, chapter, direction, number, text (default: text)
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

from odt_common import (
    NS,
    find_text_position_in_element,
    insert_after_text_in_element,
    parse_xml_from_zip,
    q,
    update_meta_for_edit,
    wrap_text_across_elements,
    wrap_text_with_pair_in_element,
    write_odt_with_replacements,
    xml_bytes,
)

DISPLAY_VALUES = ["page", "chapter", "direction", "number", "text"]


def find_paragraphs(content_root: ET.Element) -> list[ET.Element]:
    body = content_root.find(".//office:text", NS)
    if body is None:
        raise SystemExit("office:text not found")
    return [n for n in body.iter() if n.tag in {q("text", "p"), q("text", "h")}]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odt", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--mark", help="set text:reference-mark with this name (point)")
    group.add_argument("--mark-range", help="set text:reference-mark-start/end pair (range)")
    group.add_argument("--ref-to", help="insert a reference TO this name")
    parser.add_argument("--anchor", help="text substring for insertion location")
    parser.add_argument("--start-anchor", help="(with --mark-range) range start anchor")
    parser.add_argument("--end-anchor", help="(with --mark-range) range end anchor")
    parser.add_argument(
        "--kind", choices=["bookmark", "reference"], help="(with --ref-to) which kind of reference to emit"
    )
    parser.add_argument(
        "--display",
        choices=DISPLAY_VALUES,
        default="text",
        help="(with --ref-to) reference-format attribute (default: text)",
    )
    args = parser.parse_args()

    content = parse_xml_from_zip(args.input_odt, "content.xml")
    paragraphs = find_paragraphs(content)

    inserted = False
    label = ""

    if args.mark is not None:
        if args.anchor is None:
            raise SystemExit("--mark requires --anchor")
        for paragraph in paragraphs:
            if find_text_position_in_element(paragraph, args.anchor) is None:
                continue
            mark = ET.Element(q("text", "reference-mark"), {q("text", "name"): args.mark})
            if insert_after_text_in_element(paragraph, args.anchor, mark):
                inserted = True
                label = args.mark
                break
    elif args.mark_range is not None:
        if args.start_anchor is None or args.end_anchor is None:
            raise SystemExit("--mark-range requires --start-anchor and --end-anchor")
        for paragraph in paragraphs:
            start = ET.Element(q("text", "reference-mark-start"), {q("text", "name"): args.mark_range})
            end = ET.Element(q("text", "reference-mark-end"), {q("text", "name"): args.mark_range})
            if wrap_text_with_pair_in_element(paragraph, args.start_anchor, args.end_anchor, start, end):
                inserted = True
                label = args.mark_range
                break
        if not inserted:
            start = ET.Element(q("text", "reference-mark-start"), {q("text", "name"): args.mark_range})
            end = ET.Element(q("text", "reference-mark-end"), {q("text", "name"): args.mark_range})
            if wrap_text_across_elements(paragraphs, args.start_anchor, args.end_anchor, start, end):
                inserted = True
                label = args.mark_range
    else:
        # --ref-to
        if args.kind is None:
            raise SystemExit("--ref-to requires --kind bookmark|reference")
        if args.anchor is None:
            raise SystemExit("--ref-to requires --anchor")
        ref_tag = q("text", "bookmark-ref") if args.kind == "bookmark" else q("text", "reference-ref")
        for paragraph in paragraphs:
            if find_text_position_in_element(paragraph, args.anchor) is None:
                continue
            ref = ET.Element(
                ref_tag,
                {
                    q("text", "ref-name"): args.ref_to,
                    q("text", "reference-format"): args.display,
                },
            )
            ref.text = args.ref_to  # Default visible text; LO replaces on rendering.
            if insert_after_text_in_element(paragraph, args.anchor, ref):
                inserted = True
                label = args.ref_to
                break

    if not inserted:
        print("warning: anchor not found, no insertion done", file=sys.stderr)
        write_odt_with_replacements(args.input_odt, args.output, {})
        return

    meta = parse_xml_from_zip(args.input_odt, "meta.xml")
    update_meta_for_edit(meta)
    write_odt_with_replacements(
        args.input_odt,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(label)


if __name__ == "__main__":
    main()
