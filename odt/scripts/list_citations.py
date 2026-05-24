#!/usr/bin/env python3
"""List all text:bibliography-mark citations in an ODT file as JSON."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

from odt_common import NS, parse_xml_from_zip, q


def collect_citations(content_root: ET.Element) -> list[dict[str, Any]]:
    body = content_root.find(".//office:text", NS)
    if body is None:
        raise SystemExit("office:text not found")
    results: list[dict[str, object]] = []
    paragraphs: list[ET.Element] = []
    for child in body.iter():
        if child.tag in {q("text", "p"), q("text", "h")}:
            paragraphs.append(child)

    for para_index, paragraph in enumerate(paragraphs, start=1):
        for mark in paragraph.iter(q("text", "bibliography-mark")):
            entry: dict[str, object] = {
                "identifier": mark.attrib.get(q("text", "identifier")),
                "text": mark.text,
                "paragraph_index": para_index,
                "fields": {},
            }
            text_ns = f"{{{NS['text']}}}"
            fields: dict[str, str] = {}
            for attr_name, value in mark.attrib.items():
                if attr_name.startswith(text_ns) and attr_name != q("text", "identifier"):
                    fields[attr_name[len(text_ns) :]] = value
            entry["fields"] = fields
            results.append(entry)
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odt", type=Path)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    content = parse_xml_from_zip(args.input_odt, "content.xml")
    citations = collect_citations(content)
    if args.json:
        print(json.dumps(citations, ensure_ascii=False, indent=2))
        return
    for cit in citations:
        bt = cit["fields"].get("bibliography-type", "?")
        title = cit["fields"].get("title", "")
        print(f"[{bt}] {cit['identifier']} — {title}")


if __name__ == "__main__":
    main()
