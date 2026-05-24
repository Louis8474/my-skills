#!/usr/bin/env python3
"""Embed a MathML formula into an ODT as an Object N/ sub-file.

Three input modes (one required, mutually exclusive):
- --latex SNIPPET       : LaTeX math source; converted via pandoc.
- --mathml PATH         : read MathML XML from file.
- --mathml-inline XML   : MathML XML as a CLI string.

The math object is embedded as `Object N/content.xml` with the `math:math`
element as root. The main `content.xml` gains a `<draw:frame><draw:object/>`
inside a new paragraph anchored at --anchor (or --paragraph index).
"""

from __future__ import annotations

import argparse
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from odt_common import (
    NS,
    copy_with_multiple_members,
    ensure_manifest_entry,
    find_text_position_in_element,
    insert_after_text_in_element,
    insert_in_paragraph,
    latex_to_mathml,
    parse_xml_from_zip,
    q,
    unique_object_name,
    update_meta_for_edit,
    xml_bytes,
)

MATH_MIMETYPE = "application/vnd.oasis.opendocument.formula"


def find_paragraphs(content_root: ET.Element) -> list[ET.Element]:
    body = content_root.find(".//office:text", NS)
    if body is None:
        raise SystemExit("office:text not found")
    return [n for n in body.iter() if n.tag in {q("text", "p"), q("text", "h")}]


def build_object_frame(object_path: str, width: str, height: str) -> ET.Element:
    """Build <draw:frame><draw:object xlink:href="./Object N/"/></draw:frame>."""
    frame = ET.Element(
        q("draw", "frame"),
        {
            q("draw", "name"): object_path,
            q("svg", "width"): width,
            q("svg", "height"): height,
        },
    )
    ET.SubElement(
        frame,
        q("draw", "object"),
        {
            q("xlink", "href"): f"./{object_path}/",
            q("xlink", "type"): "simple",
            q("xlink", "show"): "embed",
            q("xlink", "actuate"): "onLoad",
        },
    )
    return frame


def normalize_mathml(raw: bytes) -> bytes:
    """Ensure the MathML bytes are a complete <math:math> document with prolog.

    Accepts:
      - raw <math:math>... or <math ...> ... </math> snippets (with or without prolog)
      - pandoc output already containing <math> XML

    Emits UTF-8 bytes with XML declaration and the namespace declared.
    """
    text: str = raw.decode("utf-8") if isinstance(raw, bytes) else raw
    text = text.strip()
    # Re-write root prefix to math: namespace declaration for consistency.
    if text.startswith("<?xml"):
        # Already has declaration — keep as-is but ensure xmlns is present.
        return text.encode("utf-8")
    # Add declaration; ensure the math namespace is bound on the root.
    if "xmlns" not in text[:200]:
        # Inject xmlns into the first tag.
        first_close = text.find(">")
        if first_close > 0:
            text = text[:first_close] + ' xmlns="http://www.w3.org/1998/Math/MathML"' + text[first_close:]
    return ("<?xml version='1.0' encoding='UTF-8'?>\n" + text).encode("utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odt", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--anchor", help="text substring; embed object after first match")
    parser.add_argument("--paragraph", type=int, help="1-based paragraph index")
    parser.add_argument("--position", choices=["start", "end"], default="end")
    parser.add_argument("--latex", help="LaTeX math snippet (requires pandoc)")
    parser.add_argument("--mathml", type=Path, help="path to MathML XML file")
    parser.add_argument("--mathml-inline", help="MathML XML as a string")
    parser.add_argument("--width", default="4cm")
    parser.add_argument("--height", default="1cm")
    args = parser.parse_args()

    modes = sum([args.latex is not None, args.mathml is not None, args.mathml_inline is not None])
    if modes != 1:
        raise SystemExit("provide exactly one of --latex / --mathml / --mathml-inline")
    if (args.anchor is None) == (args.paragraph is None):
        raise SystemExit("provide exactly one of --anchor / --paragraph")

    # Obtain MathML payload bytes.
    if args.latex is not None:
        mathml_bytes = latex_to_mathml(args.latex)
    elif args.mathml is not None:
        mathml_bytes = args.mathml.read_bytes()
    else:
        mathml_bytes = args.mathml_inline.encode("utf-8")
    object_content = normalize_mathml(mathml_bytes)

    # Choose Object N path.
    with zipfile.ZipFile(args.input_odt) as archive:
        existing = set(archive.namelist())
    object_path = unique_object_name(existing)

    content = parse_xml_from_zip(args.input_odt, "content.xml")
    manifest = parse_xml_from_zip(args.input_odt, "META-INF/manifest.xml")
    paragraphs = find_paragraphs(content)

    frame = build_object_frame(object_path, args.width, args.height)
    # Wrap in a paragraph for body-level math, or insert as inline?
    # ODT supports inline math via draw:frame as child of text:p — we insert
    # the frame directly into the existing paragraph (inline behavior).
    inserted = False
    if args.anchor is not None:
        for paragraph in paragraphs:
            if find_text_position_in_element(paragraph, args.anchor) is None:
                continue
            if insert_after_text_in_element(paragraph, args.anchor, frame):
                inserted = True
                break
    else:
        idx = args.paragraph
        if idx < 1 or idx > len(paragraphs):
            raise SystemExit(f"paragraph index out of range: {idx}")
        insert_in_paragraph(paragraphs[idx - 1], args.position, frame)
        inserted = True

    if not inserted:
        print(f"warning: anchor not found, no math inserted: {args.anchor!r}", file=sys.stderr)
        # Fall through and write unchanged (consistent with other scripts).
        copy_with_multiple_members(args.input_odt, args.output, {}, {})
        return

    # Manifest entries for the new Object N/ sub-package.
    ensure_manifest_entry(manifest, f"{object_path}/", MATH_MIMETYPE)
    ensure_manifest_entry(manifest, f"{object_path}/content.xml", "text/xml")

    meta = parse_xml_from_zip(args.input_odt, "meta.xml")
    update_meta_for_edit(meta)

    copy_with_multiple_members(
        args.input_odt,
        args.output,
        new_members={f"{object_path}/content.xml": object_content},
        replacements={
            "content.xml": xml_bytes(content),
            "META-INF/manifest.xml": xml_bytes(manifest),
            "meta.xml": xml_bytes(meta),
        },
    )
    print(object_path)


if __name__ == "__main__":
    main()
