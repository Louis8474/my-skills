#!/usr/bin/env python3
"""List all text:note elements (footnotes and endnotes) in an ODT file as JSON."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from xml.etree import ElementTree as ET

from odt_common import NS, parse_xml_from_zip, q

CONTEXT_WINDOW = 40  # characters before and after the note marker


def element_text(element: ET.Element) -> str:
    parts: list[str] = []
    for node in element.iter():
        if node.text:
            parts.append(node.text)
        if node.tail:
            parts.append(node.tail)
    return "".join(parts)


def paragraph_text_with_marker(paragraph: ET.Element, note: ET.Element) -> tuple[str, int]:
    """Return paragraph text with {NOTE} marker substituting the note's position,
    and the index of the marker."""
    parts: list[str] = []
    marker_idx = -1

    def visit(node: ET.Element) -> None:
        nonlocal marker_idx
        if node is note:
            marker_idx = sum(len(p) for p in parts)
            parts.append("{NOTE}")
            # Don't descend further into the note's body
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
    return "".join(parts), marker_idx


def anchor_context(text: str, marker_idx: int) -> str:
    if marker_idx < 0:
        return ""
    start = max(0, marker_idx - CONTEXT_WINDOW)
    end = min(len(text), marker_idx + len("{NOTE}") + CONTEXT_WINDOW)
    snippet = text[start:end]
    prefix = "…" if start > 0 else ""
    suffix = "…" if end < len(text) else ""
    return prefix + snippet + suffix


def collect_notes(content_root: ET.Element) -> list[dict[str, object]]:
    body = content_root.find(".//office:text", NS)
    if body is None:
        raise SystemExit("office:text not found")
    paragraphs: list[ET.Element] = []
    for child in body.iter():
        if child.tag in {q("text", "p"), q("text", "h")}:
            paragraphs.append(child)

    results: list[dict[str, object]] = []
    for para_index, paragraph in enumerate(paragraphs, start=1):
        for note in paragraph.iter(q("text", "note")):
            if note is paragraph:
                continue
            body_el = note.find("text:note-body", NS)
            citation_el = note.find("text:note-citation", NS)
            para_text, marker_pos = paragraph_text_with_marker(paragraph, note)
            results.append(
                {
                    "id": note.attrib.get(q("text", "id")),
                    "class": note.attrib.get(q("text", "note-class"), "footnote"),
                    "citation": citation_el.text if citation_el is not None else None,
                    "body": element_text(body_el) if body_el is not None else "",
                    "paragraph_index": para_index,
                    "anchor_context": anchor_context(para_text, marker_pos),
                }
            )
    # Also include notes that are direct body children (legacy create_minimal_odt style)
    for note in body:
        if note.tag != q("text", "note"):
            continue
        body_el = note.find("text:note-body", NS)
        citation_el = note.find("text:note-citation", NS)
        results.append(
            {
                "id": note.attrib.get(q("text", "id")),
                "class": note.attrib.get(q("text", "note-class"), "footnote"),
                "citation": citation_el.text if citation_el is not None else None,
                "body": element_text(body_el) if body_el is not None else "",
                "paragraph_index": None,
                "anchor_context": "",
            }
        )
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odt", type=Path)
    parser.add_argument("--json", action="store_true", help="emit JSON (default: human-readable)")
    args = parser.parse_args()
    content = parse_xml_from_zip(args.input_odt, "content.xml")
    notes = collect_notes(content)
    if args.json:
        print(json.dumps(notes, ensure_ascii=False, indent=2))
        return
    for note in notes:
        print(f"[{note['class']}:{note['id']}] {note['body']}")
        if note["anchor_context"]:
            print(f"    in: {note['anchor_context']}")


if __name__ == "__main__":
    main()
