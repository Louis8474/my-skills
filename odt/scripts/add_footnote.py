#!/usr/bin/env python3
"""Insert a text:note (footnote or endnote) into an ODT paragraph.

Two anchor modes:
- --anchor TEXT: locate the first occurrence of TEXT inside any paragraph and
  insert the note immediately after it (the anchor is preserved).
- --paragraph N: insert at the start or end (per --position) of the N-th
  paragraph (1-based) of the document body.
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
    write_odt_with_replacements,
    xml_bytes,
)


def build_note(note_class: str, body_text: str, citation: str, note_id: str) -> ET.Element:
    """Build a text:note element with citation marker and body paragraph."""
    note = ET.Element(
        q("text", "note"),
        {
            q("text", "note-class"): note_class,
            q("text", "id"): note_id,
        },
    )
    citation_el = ET.SubElement(note, q("text", "note-citation"))
    citation_el.text = citation
    body = ET.SubElement(note, q("text", "note-body"))
    body_p = ET.SubElement(body, q("text", "p"))
    body_p.text = body_text
    return note


def next_note_id(content_root: ET.Element, note_class: str) -> str:
    """Find an unused text:id starting from ftn0/edn0 incrementally."""
    prefix = "ftn" if note_class == "footnote" else "edn"
    existing = {
        n.attrib.get(q("text", "id")) for n in content_root.iter(q("text", "note")) if n.attrib.get(q("text", "id"))
    }
    counter = 0
    while f"{prefix}{counter}" in existing:
        counter += 1
    return f"{prefix}{counter}"


def find_paragraphs(content_root: ET.Element) -> list[ET.Element]:
    """Return all top-level text:p and text:h in the body (in order, excluding nested)."""
    body = content_root.find(".//office:text", NS)
    if body is None:
        raise SystemExit("office:text not found")
    paragraphs: list[ET.Element] = []
    for child in body.iter():
        if child.tag in {q("text", "p"), q("text", "h")}:
            paragraphs.append(child)
    return paragraphs


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odt", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--anchor", help="text substring to find; note is inserted after the first match")
    group.add_argument("--paragraph", type=int, help="1-based paragraph index")
    parser.add_argument(
        "--position", choices=["start", "end"], default="end", help="position within --paragraph (default: end)"
    )
    parser.add_argument("--body", required=True, help="note body text")
    parser.add_argument("--class", dest="note_class", choices=["footnote", "endnote"], default="footnote")
    parser.add_argument("--id", dest="note_id", help="explicit text:id (default: auto-generated)")
    parser.add_argument("--citation", default="*", help="text:note-citation content (default: '*')")
    args = parser.parse_args()

    content = parse_xml_from_zip(args.input_odt, "content.xml")
    note_id = args.note_id or next_note_id(content, args.note_class)
    note = build_note(args.note_class, args.body, args.citation, note_id)

    paragraphs = find_paragraphs(content)

    if args.anchor is not None:
        # Try each paragraph in order; insert into the first one containing the anchor.
        inserted = False
        for paragraph in paragraphs:
            position = find_text_position_in_element(paragraph, args.anchor)
            if position is None:
                continue
            if not insert_after_text_in_element(paragraph, args.anchor, note):
                continue
            inserted = True
            break
        if not inserted:
            print(f"warning: anchor not found, no note inserted: {args.anchor!r}", file=sys.stderr)
            # Still write output (idempotent), but skip meta update.
            write_odt_with_replacements(args.input_odt, args.output, {})
            return
    else:
        idx = args.paragraph
        if idx < 1 or idx > len(paragraphs):
            raise SystemExit(f"paragraph index out of range: {idx} (have {len(paragraphs)})")
        insert_in_paragraph(paragraphs[idx - 1], args.position, note)

    meta = parse_xml_from_zip(args.input_odt, "meta.xml")
    update_meta_for_edit(meta)
    write_odt_with_replacements(
        args.input_odt,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(note_id)


if __name__ == "__main__":
    main()
