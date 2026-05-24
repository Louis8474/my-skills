#!/usr/bin/env python3
"""Extract visible slide text and speaker notes from an ODP file."""

from __future__ import annotations

import argparse
import json
import zipfile
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

NS = {
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "draw": "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
    "presentation": "urn:oasis:names:tc:opendocument:xmlns:presentation:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
}


def qname(prefix: str, local: str) -> str:
    return f"{{{NS[prefix]}}}{local}"


def element_text(element: ET.Element) -> str:
    parts: list[str] = []
    for node in element.iter():
        if node.text:
            parts.append(node.text)
        if node.tag == qname("text", "line-break"):
            parts.append("\n")
        if node.tail:
            parts.append(node.tail)
    return " ".join("".join(parts).split())


def text_blocks(root: ET.Element, scope: ET.Element) -> list[str]:
    blocks: list[str] = []
    for paragraph in scope.findall(".//text:p", NS):
        value = element_text(paragraph)
        if value:
            blocks.append(value)
    return blocks


def extract(path: Path) -> list[dict[str, Any]]:
    with zipfile.ZipFile(path) as archive:
        with archive.open("content.xml") as content:
            root = ET.parse(content).getroot()

    slides: list[dict[str, Any]] = []
    for index, page in enumerate(root.findall(".//draw:page", NS), start=1):
        notes = page.find("presentation:notes", NS)
        slide_text_scope = ET.fromstring(ET.tostring(page))
        for copied_notes in slide_text_scope.findall("presentation:notes", NS):
            slide_text_scope.remove(copied_notes)

        slides.append(
            {
                "index": index,
                "name": page.attrib.get(qname("draw", "name"), f"Slide {index}"),
                "master_page": page.attrib.get(qname("draw", "master-page-name")),
                "text": text_blocks(root, slide_text_scope),
                "notes": text_blocks(root, notes) if notes is not None else [],
            }
        )
    return slides


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("odp", type=Path)
    parser.add_argument("--json", action="store_true", help="write structured JSON")
    args = parser.parse_args()

    slides = extract(args.odp)
    if args.json:
        print(json.dumps(slides, ensure_ascii=False, indent=2))
        return

    for slide in slides:
        print(f"## {slide['index']}. {slide['name']}")
        if slide.get("master_page"):
            print(f"Master: {slide['master_page']}")
        for block in slide["text"]:
            print(block)
        if slide["notes"]:
            print("\nNotes:")
            for block in slide["notes"]:
                print(block)
        print()


if __name__ == "__main__":
    main()
