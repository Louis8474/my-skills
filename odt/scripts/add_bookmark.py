#!/usr/bin/env python3
"""Insert a text:bookmark (point or range) into an ODT paragraph.

Modes:
- Point: --anchor TEXT (or --paragraph N) — single text:bookmark at the location.
- Range (intra-paragraph): --start-anchor START --end-anchor END — emits a
  matched text:bookmark-start / text:bookmark-end pair.
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
    insert_in_paragraph,
    parse_xml_from_zip,
    q,
    update_meta_for_edit,
    wrap_text_across_elements,
    wrap_text_with_pair_in_element,
    write_odt_with_replacements,
    xml_bytes,
)


def find_paragraphs(content_root: ET.Element) -> list[ET.Element]:
    body = content_root.find(".//office:text", NS)
    if body is None:
        raise SystemExit("office:text not found")
    return [n for n in body.iter() if n.tag in {q("text", "p"), q("text", "h")}]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odt", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--name", required=True, help="bookmark name (must be unique)")
    parser.add_argument("--anchor", help="text substring; insert point bookmark after first match")
    parser.add_argument("--paragraph", type=int, help="1-based paragraph index for point bookmark")
    parser.add_argument(
        "--position", choices=["start", "end"], default="end", help="position within --paragraph (default: end)"
    )
    parser.add_argument("--start-anchor", help="(with --end-anchor) text substring marking range start")
    parser.add_argument("--end-anchor", help="(with --start-anchor) text substring marking range end")
    args = parser.parse_args()

    if (args.start_anchor is None) != (args.end_anchor is None):
        raise SystemExit("--start-anchor and --end-anchor must be given together")
    modes_given = sum(
        [
            args.start_anchor is not None,
            args.anchor is not None,
            args.paragraph is not None,
        ]
    )
    if modes_given != 1:
        raise SystemExit("provide exactly one of: --anchor / --paragraph / (--start-anchor + --end-anchor)")

    content = parse_xml_from_zip(args.input_odt, "content.xml")
    paragraphs = find_paragraphs(content)

    inserted = False

    if args.start_anchor is not None:
        # Range bookmark — try intra-paragraph first, then cross-paragraph.
        for paragraph in paragraphs:
            start_el = ET.Element(q("text", "bookmark-start"), {q("text", "name"): args.name})
            end_el = ET.Element(q("text", "bookmark-end"), {q("text", "name"): args.name})
            if wrap_text_with_pair_in_element(paragraph, args.start_anchor, args.end_anchor, start_el, end_el):
                inserted = True
                break
        if not inserted:
            start_el = ET.Element(q("text", "bookmark-start"), {q("text", "name"): args.name})
            end_el = ET.Element(q("text", "bookmark-end"), {q("text", "name"): args.name})
            if wrap_text_across_elements(paragraphs, args.start_anchor, args.end_anchor, start_el, end_el):
                inserted = True
    elif args.anchor is not None:
        for paragraph in paragraphs:
            if find_text_position_in_element(paragraph, args.anchor) is None:
                continue
            bm = ET.Element(q("text", "bookmark"), {q("text", "name"): args.name})
            if insert_after_text_in_element(paragraph, args.anchor, bm):
                inserted = True
                break
    else:
        idx = args.paragraph
        if idx < 1 or idx > len(paragraphs):
            raise SystemExit(f"paragraph index out of range: {idx} (have {len(paragraphs)})")
        bm = ET.Element(q("text", "bookmark"), {q("text", "name"): args.name})
        insert_in_paragraph(paragraphs[idx - 1], args.position, bm)
        inserted = True

    if not inserted:
        msg = (
            f"warning: anchors not found, no bookmark inserted: {args.start_anchor!r}..{args.end_anchor!r}"
            if args.start_anchor
            else f"warning: anchor not found, no bookmark inserted: {args.anchor!r}"
        )
        print(msg, file=sys.stderr)
        write_odt_with_replacements(args.input_odt, args.output, {})
        return

    meta = parse_xml_from_zip(args.input_odt, "meta.xml")
    update_meta_for_edit(meta)
    write_odt_with_replacements(
        args.input_odt,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(args.name)


if __name__ == "__main__":
    main()
