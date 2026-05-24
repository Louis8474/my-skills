#!/usr/bin/env python3
"""List all bookmarks, reference-marks, sequences, and references in an ODT."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from xml.etree import ElementTree as ET

from odt_common import NS, parse_xml_from_zip, q


def context_for(paragraph: ET.Element, target: ET.Element) -> str:
    """Build a short text context window around *target* inside *paragraph*."""
    parts: list[str] = []
    marker_at = -1

    def visit(node: ET.Element) -> None:
        nonlocal marker_at
        if node is target:
            marker_at = sum(len(p) for p in parts)
            parts.append("{MARK}")
            if node.tail:
                parts.append(node.tail)
            return
        if node.text:
            parts.append(node.text)
        for child in node:
            visit(child)
        if node is not paragraph and node.tail:
            parts.append(node.tail)

    visit(paragraph)
    if marker_at < 0:
        return ""
    text = "".join(parts)
    start = max(0, marker_at - 40)
    end = min(len(text), marker_at + len("{MARK}") + 40)
    return ("…" if start > 0 else "") + text[start:end] + ("…" if end < len(text) else "")


def collect(content_root: ET.Element) -> dict[str, list[dict[str, object]]]:
    body = content_root.find(".//office:text", NS)
    if body is None:
        raise SystemExit("office:text not found")

    paragraphs = [n for n in body.iter() if n.tag in {q("text", "p"), q("text", "h")}]
    para_index_of: dict[int, int] = {}
    for idx, para in enumerate(paragraphs, start=1):
        para_index_of[id(para)] = idx

    def parent_paragraph(el: ET.Element) -> ET.Element | None:
        for paragraph in paragraphs:
            if el is paragraph:
                return paragraph
            for descendant in paragraph.iter():
                if descendant is el:
                    return paragraph
        return None

    bookmarks: list[dict[str, object]] = []
    reference_marks: list[dict[str, object]] = []
    sequences: list[dict[str, object]] = []
    references: list[dict[str, object]] = []

    for el in content_root.iter():
        tag = el.tag
        if tag == q("text", "bookmark"):
            paragraph = parent_paragraph(el)
            bookmarks.append(
                {
                    "name": el.attrib.get(q("text", "name")),
                    "kind": "point",
                    "paragraph_index": para_index_of.get(id(paragraph)) if paragraph is not None else None,
                    "context": context_for(paragraph, el) if paragraph is not None else "",
                }
            )
        elif tag == q("text", "bookmark-start"):
            paragraph = parent_paragraph(el)
            bookmarks.append(
                {
                    "name": el.attrib.get(q("text", "name")),
                    "kind": "range-start",
                    "paragraph_index": para_index_of.get(id(paragraph)) if paragraph is not None else None,
                    "context": context_for(paragraph, el) if paragraph is not None else "",
                }
            )
        elif tag == q("text", "bookmark-end"):
            paragraph = parent_paragraph(el)
            bookmarks.append(
                {
                    "name": el.attrib.get(q("text", "name")),
                    "kind": "range-end",
                    "paragraph_index": para_index_of.get(id(paragraph)) if paragraph is not None else None,
                    "context": context_for(paragraph, el) if paragraph is not None else "",
                }
            )
        elif tag in (q("text", "reference-mark"), q("text", "reference-mark-start"), q("text", "reference-mark-end")):
            paragraph = parent_paragraph(el)
            kind = (
                "point"
                if tag == q("text", "reference-mark")
                else "range-start"
                if tag.endswith("start}") or tag.endswith("-start")
                else "range-end"
            )
            # Local tag name disambiguation:
            local = tag.rsplit("}", 1)[-1]
            if local == "reference-mark":
                kind = "point"
            elif local == "reference-mark-start":
                kind = "range-start"
            else:
                kind = "range-end"
            reference_marks.append(
                {
                    "name": el.attrib.get(q("text", "name")),
                    "kind": kind,
                    "paragraph_index": para_index_of.get(id(paragraph)) if paragraph is not None else None,
                    "context": context_for(paragraph, el) if paragraph is not None else "",
                }
            )
        elif tag == q("text", "sequence"):
            paragraph = parent_paragraph(el)
            sequences.append(
                {
                    "name": el.attrib.get(q("text", "name")),
                    "ref_name": el.attrib.get(q("text", "ref-name")),
                    "value": el.text,
                    "paragraph_index": para_index_of.get(id(paragraph)) if paragraph is not None else None,
                }
            )
        elif tag == q("text", "bookmark-ref"):
            paragraph = parent_paragraph(el)
            references.append(
                {
                    "kind": "bookmark-ref",
                    "ref_name": el.attrib.get(q("text", "ref-name")),
                    "display": el.attrib.get(q("text", "reference-format"), "text"),
                    "paragraph_index": para_index_of.get(id(paragraph)) if paragraph is not None else None,
                }
            )
        elif tag == q("text", "reference-ref"):
            paragraph = parent_paragraph(el)
            references.append(
                {
                    "kind": "reference-ref",
                    "ref_name": el.attrib.get(q("text", "ref-name")),
                    "display": el.attrib.get(q("text", "reference-format"), "text"),
                    "paragraph_index": para_index_of.get(id(paragraph)) if paragraph is not None else None,
                }
            )
        elif tag == q("text", "sequence-ref"):
            paragraph = parent_paragraph(el)
            references.append(
                {
                    "kind": "sequence-ref",
                    "ref_name": el.attrib.get(q("text", "ref-name")),
                    "display": el.attrib.get(q("text", "reference-format"), "text"),
                    "paragraph_index": para_index_of.get(id(paragraph)) if paragraph is not None else None,
                }
            )

    return {
        "bookmarks": bookmarks,
        "reference_marks": reference_marks,
        "sequences": sequences,
        "references": references,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odt", type=Path)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    content = parse_xml_from_zip(args.input_odt, "content.xml")
    data = collect(content)
    if args.json:
        print(json.dumps(data, ensure_ascii=False, indent=2))
        return
    print(f"Bookmarks: {len(data['bookmarks'])}")
    for bm in data["bookmarks"]:
        print(f"  [{bm['kind']}] {bm['name']} (paragraph {bm['paragraph_index']})")
    print(f"Reference marks: {len(data['reference_marks'])}")
    for rm in data["reference_marks"]:
        print(f"  [{rm['kind']}] {rm['name']} (paragraph {rm['paragraph_index']})")
    print(f"Sequences: {len(data['sequences'])}")
    for seq in data["sequences"]:
        print(f"  {seq['name']}={seq['value']} (ref-name {seq['ref_name']})")
    print(f"References: {len(data['references'])}")
    for ref in data["references"]:
        print(f"  [{ref['kind']}] → {ref['ref_name']} (display: {ref['display']})")


if __name__ == "__main__":
    main()
