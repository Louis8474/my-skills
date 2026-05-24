#!/usr/bin/env python3
"""Insert a text:bibliography-mark citation into an ODT paragraph.

Sources:
- `--source refs.bib --key X`: load entry X from a BibTeX file (requires bibtexparser).
- `--source refs.json --key X`: load entry X from a CSL-JSON file (stdlib).
- `--identifier X --field name=value`: build manually from CLI args.

Combine sources and --field: --field values override the source's values.
"""

from __future__ import annotations

import argparse
import json
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

# Locate the bundled odf_lib/ package (see odt_common.py for the rationale).
for _parent in Path(__file__).resolve().parents:
    if (_parent / "odf_lib" / "odf_common.py").is_file():
        if str(_parent) not in sys.path:
            sys.path.insert(0, str(_parent))
        break

from odf_lib.citation_mapping import (  # noqa: E402
    ODF_BIBLIOGRAPHY_FIELDS,
    bibtex_entry_to_odf_fields,
    csl_entry_to_odf_fields,
)


def load_csl_json(path: Path, key: str) -> dict[str, str]:
    """Load a single entry from a CSL-JSON file."""
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        raise SystemExit(f"CSL-JSON must be a list, got {type(data).__name__}: {path}")
    for entry in data:
        if isinstance(entry, dict) and entry.get("id") == key:
            return csl_entry_to_odf_fields(entry)
    raise SystemExit(f"key {key!r} not found in {path}")


def load_bibtex(path: Path, key: str) -> dict[str, str]:
    """Load a single entry from a BibTeX file (lazy import)."""
    try:
        import bibtexparser  # type: ignore
    except ImportError:
        raise SystemExit(
            "BibTeX parsing requires bibtexparser. Install with:\n"
            "  pip install open-document-skills[scholarly]\n"
            "or convert your .bib to CSL-JSON (e.g. via pandoc-citeproc) and use --source refs.json"
        )
    text = path.read_text(encoding="utf-8")
    # bibtexparser v1 and v2 have different APIs; support both.
    if hasattr(bibtexparser, "parse_string"):
        library = bibtexparser.parse_string(text)
        for entry in library.entries:
            if entry.key == key:
                bib_dict: dict[str, object] = {"ENTRYTYPE": entry.entry_type}
                for field in entry.fields:
                    bib_dict[field.key] = field.value
                return bibtex_entry_to_odf_fields(bib_dict)
    else:
        db = bibtexparser.loads(text)
        for entry in db.entries:
            if entry.get("ID") == key:
                return bibtex_entry_to_odf_fields(entry)
    raise SystemExit(f"key {key!r} not found in {path}")


def parse_field_args(field_args: list[str]) -> dict[str, str]:
    out: dict[str, str] = {}
    for arg in field_args:
        if "=" not in arg:
            raise SystemExit(f"--field expects name=value, got: {arg!r}")
        name, value = arg.split("=", 1)
        out[name.strip()] = value
    return out


def build_citation(identifier: str, fields: dict[str, str]) -> ET.Element:
    """Build a text:bibliography-mark element with identifier as visible text."""
    attribs: dict[str, str] = {q("text", "identifier"): identifier}
    for name, value in fields.items():
        if name == "identifier":
            continue  # already set
        if name not in ODF_BIBLIOGRAPHY_FIELDS:
            # Allow but warn — useful for forward-compat
            pass
        attribs[q("text", name)] = value
    mark = ET.Element(q("text", "bibliography-mark"), attribs)
    mark.text = identifier
    return mark


def find_paragraphs(content_root: ET.Element) -> list[ET.Element]:
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
    group.add_argument("--anchor", help="text substring to find; citation inserted after first match")
    group.add_argument("--paragraph", type=int, help="1-based paragraph index")
    parser.add_argument("--position", choices=["start", "end"], default="end")
    parser.add_argument("--source", type=Path, help="path to .bib or .json bibliography")
    parser.add_argument("--key", help="entry key/identifier in --source")
    parser.add_argument("--identifier", help="explicit identifier (alternative to --source)")
    parser.add_argument("--field", action="append", default=[], help="name=value; repeatable")
    args = parser.parse_args()

    fields: dict[str, str] = {}
    identifier: str | None = args.identifier

    if args.source is not None:
        if args.key is None:
            raise SystemExit("--source requires --key")
        suffix = args.source.suffix.lower()
        if suffix == ".bib":
            fields = load_bibtex(args.source, args.key)
        elif suffix == ".json":
            fields = load_csl_json(args.source, args.key)
        else:
            raise SystemExit(f"unrecognized source extension {suffix!r}; expected .bib or .json")
        if identifier is None:
            identifier = args.key

    fields.update(parse_field_args(args.field))

    if identifier is None:
        raise SystemExit("must provide --identifier or --source+--key")

    citation = build_citation(identifier, fields)
    content = parse_xml_from_zip(args.input_odt, "content.xml")
    paragraphs = find_paragraphs(content)

    if args.anchor is not None:
        inserted = False
        for paragraph in paragraphs:
            if find_text_position_in_element(paragraph, args.anchor) is None:
                continue
            if insert_after_text_in_element(paragraph, args.anchor, citation):
                inserted = True
                break
        if not inserted:
            print(f"warning: anchor not found, no citation inserted: {args.anchor!r}", file=sys.stderr)
            write_odt_with_replacements(args.input_odt, args.output, {})
            return
    else:
        idx = args.paragraph
        if idx < 1 or idx > len(paragraphs):
            raise SystemExit(f"paragraph index out of range: {idx} (have {len(paragraphs)})")
        insert_in_paragraph(paragraphs[idx - 1], args.position, citation)

    meta = parse_xml_from_zip(args.input_odt, "meta.xml")
    update_meta_for_edit(meta)
    write_odt_with_replacements(
        args.input_odt,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(identifier)


if __name__ == "__main__":
    main()
