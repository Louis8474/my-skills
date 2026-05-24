#!/usr/bin/env python3
"""Insert auto-numbered sequence captions (Figure, Table, Equation, ...) or refs.

Modes:
- --sequence NAME --name REF_NAME --anchor TEXT
  : adds text:sequence (auto-numbered) at anchor, creating text:sequence-decls
    entry if missing.
- --ref-to REF_NAME --anchor TEXT [--display MODE]
  : adds text:sequence-ref pointing to a sequence element.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

from odt_common import (
    NS,
    ensure_sequence_declarations,
    find_text_position_in_element,
    insert_after_text_in_element,
    parse_xml_from_zip,
    q,
    update_meta_for_edit,
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
    parser.add_argument("--sequence", help="sequence type (e.g. Figure, Table, Equation)")
    parser.add_argument("--name", help="(with --sequence) unique name for this sequence value")
    parser.add_argument("--anchor", required=True, help="text substring for insertion location")
    parser.add_argument("--ref-to", help="insert a sequence-ref to this name")
    parser.add_argument(
        "--display", choices=DISPLAY_VALUES, default="number", help="(with --ref-to) reference-format (default: number)"
    )
    args = parser.parse_args()

    if args.sequence and not args.name:
        raise SystemExit("--sequence requires --name")
    if not args.sequence and not args.ref_to:
        raise SystemExit("must provide --sequence (+ --name) or --ref-to")

    content = parse_xml_from_zip(args.input_odt, "content.xml")
    body = content.find(".//office:text", NS)
    if body is None:
        raise SystemExit("office:text not found")

    if args.sequence:
        ensure_sequence_declarations(body, [args.sequence])

    paragraphs = find_paragraphs(content)
    inserted = False
    label = ""

    if args.sequence:
        for paragraph in paragraphs:
            if find_text_position_in_element(paragraph, args.anchor) is None:
                continue
            seq = ET.Element(
                q("text", "sequence"),
                {
                    q("text", "name"): args.sequence,
                    q("text", "ref-name"): args.name,
                    q("text", "formula"): f"ooow:{args.sequence}+1",
                    q("style", "num-format"): "1",
                },
            )
            seq.text = "1"  # Placeholder; LibreOffice will recalculate.
            if insert_after_text_in_element(paragraph, args.anchor, seq):
                inserted = True
                label = args.name
                break
    else:
        for paragraph in paragraphs:
            if find_text_position_in_element(paragraph, args.anchor) is None:
                continue
            ref = ET.Element(
                q("text", "sequence-ref"),
                {
                    q("text", "ref-name"): args.ref_to,
                    q("text", "reference-format"): args.display,
                },
            )
            ref.text = args.ref_to
            if insert_after_text_in_element(paragraph, args.anchor, ref):
                inserted = True
                label = args.ref_to
                break

    if not inserted:
        print(f"warning: anchor not found, no sequence inserted: {args.anchor!r}", file=sys.stderr)
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
