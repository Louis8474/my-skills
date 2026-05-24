#!/usr/bin/env python3
"""Replace text in ODP slides, optionally scoped to a slide and/or notes.

Preserves inline children (text:span, text:note, text:a) and handles matches
that straddle child element boundaries.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from xml.etree import ElementTree as ET

from odp_common import (
    NS,
    parse_xml_from_zip,
    replace_text_in_element,
    select_slide,
    update_meta_for_edit,
    write_odp_with_replacements,
    xml_bytes,
)


def iter_target_paragraphs(root: ET.Element, slide: str | None, include_notes: bool, notes_only: bool):
    pages = [select_slide(root, slide)] if slide else root.findall(".//draw:page", NS)
    for page in pages:
        notes = page.find("presentation:notes", NS)
        if not notes_only:
            page_copy = ET.fromstring(ET.tostring(page))
            for copied_notes in page_copy.findall("presentation:notes", NS):
                page_copy.remove(copied_notes)
            visible_count = len(page_copy.findall(".//text:p", NS))
            yield from page.findall(".//text:p", NS)[:visible_count]
        if include_notes or notes_only:
            if notes is not None:
                yield from notes.findall(".//text:p", NS)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odp", type=Path)
    parser.add_argument("old")
    parser.add_argument("new")
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--slide", help="slide index (1-based) or draw:name")
    parser.add_argument("--include-notes", action="store_true", help="also replace inside speaker notes")
    parser.add_argument("--notes-only", action="store_true", help="replace only inside speaker notes")
    args = parser.parse_args()

    content = parse_xml_from_zip(args.input_odp, "content.xml")
    count = 0
    for paragraph in iter_target_paragraphs(content, args.slide, args.include_notes, args.notes_only):
        count += replace_text_in_element(paragraph, args.old, args.new)

    meta = parse_xml_from_zip(args.input_odp, "meta.xml")
    update_meta_for_edit(meta)
    write_odp_with_replacements(
        args.input_odp,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(f"replacements: {count}")


if __name__ == "__main__":
    main()
