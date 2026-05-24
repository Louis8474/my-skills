#!/usr/bin/env python3
"""Bulk-replace `[@bibkey]` placeholders in an ODT with text:bibliography-mark.

Reads a BibTeX (.bib) or CSL-JSON (.json) bibliography, then scans every
text:p and text:h in content.xml for placeholders matching the pandoc
convention (`\\[@KEY\\]`, where KEY may contain letters, digits, `_`, `:`, `-`).

Unknown keys are left in place with a warning on stderr. Idempotent: a second
run replaces nothing new.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

from odt_common import (
    NS,
    parse_xml_from_zip,
    q,
    replace_pattern_with_element_in_element,
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
    bibtex_entry_to_odf_fields,
    csl_entry_to_odf_fields,
)

DEFAULT_PATTERN = r"\[@([A-Za-z0-9_:\-]+)\]"


def load_source(path: Path) -> dict[str, dict[str, str]]:
    """Load all entries from .bib or .json; return {key: odf_fields}."""
    suffix = path.suffix.lower()
    if suffix == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise SystemExit(f"CSL-JSON must be a list: {path}")
        result: dict[str, dict[str, str]] = {}
        for entry in data:
            if isinstance(entry, dict) and "id" in entry:
                result[str(entry["id"])] = csl_entry_to_odf_fields(entry)
        return result
    if suffix == ".bib":
        try:
            import bibtexparser  # type: ignore
        except ImportError:
            raise SystemExit(
                "BibTeX parsing requires bibtexparser. Install with:\n  pip install open-document-skills[scholarly]"
            )
        text = path.read_text(encoding="utf-8")
        out: dict[str, dict[str, str]] = {}
        if hasattr(bibtexparser, "parse_string"):
            library = bibtexparser.parse_string(text)
            for entry in library.entries:
                bib_dict: dict[str, object] = {"ENTRYTYPE": entry.entry_type}
                for field in entry.fields:
                    bib_dict[field.key] = field.value
                out[entry.key] = bibtex_entry_to_odf_fields(bib_dict)
        else:
            db = bibtexparser.loads(text)
            for entry in db.entries:
                key = entry.get("ID")
                if key:
                    out[key] = bibtex_entry_to_odf_fields(entry)
        return out
    raise SystemExit(f"unrecognized source extension {suffix!r}; expected .bib or .json")


def build_mark(identifier: str, fields: dict[str, str]) -> ET.Element:
    attribs: dict[str, str] = {q("text", "identifier"): identifier}
    for name, value in fields.items():
        if name == "identifier":
            continue
        attribs[q("text", name)] = value
    mark = ET.Element(q("text", "bibliography-mark"), attribs)
    mark.text = identifier
    return mark


def paragraph_text(paragraph: ET.Element) -> str:
    """Reconstruct the plain text of a paragraph (text + tails in order)."""
    parts: list[str] = []
    if paragraph.text:
        parts.append(paragraph.text)
    for descendant in paragraph.iter():
        if descendant is paragraph:
            continue
        if descendant.text:
            parts.append(descendant.text)
        if descendant.tail:
            parts.append(descendant.tail)
    return "".join(parts)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odt", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--source", type=Path, required=True, help=".bib or .json bibliography")
    parser.add_argument("--pattern", default=DEFAULT_PATTERN, help=f"placeholder regex (default: {DEFAULT_PATTERN!r})")
    args = parser.parse_args()

    entries = load_source(args.source)
    user_pattern = re.compile(args.pattern)
    content = parse_xml_from_zip(args.input_odt, "content.xml")
    body = content.find(".//office:text", NS)
    if body is None:
        raise SystemExit("office:text not found")

    # First sweep: detect any leftover (unknown) keys across all paragraphs.
    unknown_keys: set[str] = set()
    paragraphs = [p for p in body.iter() if p.tag in {q("text", "p"), q("text", "h")}]
    for paragraph in paragraphs:
        for match in user_pattern.finditer(paragraph_text(paragraph)):
            if match.group(1) not in entries:
                unknown_keys.add(match.group(1))

    # Build a pattern that only matches KNOWN keys, so we don't touch unknowns.
    if entries:
        known_alternation = "|".join(re.escape(k) for k in sorted(entries))
        known_pattern = re.compile(rf"\[@({known_alternation})\]")
    else:
        known_pattern = None

    total_replaced = 0
    if known_pattern is not None:

        def factory(match: re.Match[str]) -> ET.Element:
            key = match.group(1)
            return build_mark(key, entries[key])

        for paragraph in paragraphs:
            total_replaced += replace_pattern_with_element_in_element(paragraph, known_pattern, factory)

    for key in sorted(unknown_keys):
        print(f"warning: placeholder [@{key}] has no entry in {args.source}", file=sys.stderr)

    if total_replaced == 0:
        write_odt_with_replacements(args.input_odt, args.output, {})
        print("replaced: 0")
        return

    meta = parse_xml_from_zip(args.input_odt, "meta.xml")
    update_meta_for_edit(meta)
    write_odt_with_replacements(
        args.input_odt,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(f"replaced: {total_replaced}")


if __name__ == "__main__":
    main()
