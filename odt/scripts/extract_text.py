#!/usr/bin/env python3
"""Extract headings, paragraphs, lists, tables, images, and notes from an ODT file."""

from __future__ import annotations

import argparse
import json
import zipfile
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

from odt_common import NS, q


def element_text(element: ET.Element) -> str:
    parts: list[str] = []
    for node in element.iter():
        if node.text:
            parts.append(node.text)
        if node.tag == q("text", "line-break"):
            parts.append("\n")
        if node.tail:
            parts.append(node.tail)
    return " ".join("".join(parts).split())


def table_rows(table: ET.Element) -> list[list[str]]:
    rows = []
    for row in table.findall(".//table:table-row", NS):
        rows.append([element_text(cell) for cell in row.findall("table:table-cell", NS)])
    return rows


def collect_blocks(parent: ET.Element, items: list[dict[str, Any]]) -> None:
    for node in list(parent):
        if node.tag == q("text", "h"):
            items.append(
                {"type": "heading", "level": node.attrib.get(q("text", "outline-level")), "text": element_text(node)}
            )
        elif node.tag == q("text", "p"):
            value = element_text(node)
            if value:
                items.append({"type": "paragraph", "text": value, "style": node.attrib.get(q("text", "style-name"))})
            for image in node.findall(".//draw:image", NS):
                items.append({"type": "image", "href": image.attrib.get(q("xlink", "href"))})
        elif node.tag == q("text", "list"):
            values = [element_text(item) for item in node.findall("text:list-item", NS)]
            values = [value for value in values if value]
            if values:
                items.append({"type": "list", "items": values})
        elif node.tag == q("table", "table"):
            items.append({"type": "table", "name": node.attrib.get(q("table", "name")), "rows": table_rows(node)})
        elif node.tag == q("text", "section"):
            items.append({"type": "section", "name": node.attrib.get(q("text", "name"))})
            collect_blocks(node, items)
        elif node.tag == q("text", "note"):
            body = node.find("text:note-body", NS)
            citation_el = node.find("text:note-citation", NS)
            items.append(
                {
                    "type": "note",
                    "text": element_text(body if body is not None else node),
                    "note_class": node.attrib.get(q("text", "note-class")),
                    "id": node.attrib.get(q("text", "id")),
                    "citation": citation_el.text if citation_el is not None else None,
                }
            )


def extract(path: Path) -> list[dict[str, Any]]:
    with zipfile.ZipFile(path) as archive:
        with archive.open("content.xml") as content:
            root = ET.parse(content).getroot()

    body = root.find(".//office:text", NS)
    if body is None:
        raise SystemExit("office:text not found")

    items: list[dict[str, object]] = []
    collect_blocks(body, items)
    return items


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("odt", type=Path)
    parser.add_argument("--json", action="store_true", help="write structured JSON")
    args = parser.parse_args()

    items = extract(args.odt)
    if args.json:
        print(json.dumps(items, ensure_ascii=False, indent=2))
        return
    for item in items:
        kind = item["type"]
        if kind == "heading":
            print(f"{'#' * int(item.get('level') or 1)} {item['text']}")
        elif kind == "paragraph":
            print(item["text"])
        elif kind == "list":
            for value in item["items"]:
                print(f"- {value}")
        elif kind == "table":
            print(f"[table {item.get('name') or ''}: {len(item['rows'])} rows]")
        elif kind == "section":
            print(f"[section] {item.get('name')}")
        elif kind == "note":
            print(f"[note] {item['text']}")
        elif kind == "image":
            print(f"[image] {item.get('href')}")


if __name__ == "__main__":
    main()
