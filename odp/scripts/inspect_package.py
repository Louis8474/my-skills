#!/usr/bin/env python3
"""Inspect the structure, media, slides, notes, and master pages of an ODP file."""

from __future__ import annotations

import argparse
import json
import zipfile
from collections import Counter
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {
    "draw": "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
    "presentation": "urn:oasis:names:tc:opendocument:xmlns:presentation:1.0",
    "style": "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
    "xlink": "http://www.w3.org/1999/xlink",
}


def qname(prefix: str, local: str) -> str:
    return f"{{{NS[prefix]}}}{local}"


def parse_xml(archive: zipfile.ZipFile, name: str) -> ET.Element | None:
    if name not in archive.namelist():
        return None
    with archive.open(name) as handle:
        return ET.parse(handle).getroot()


def summarize(path: Path) -> dict[str, object]:
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
        content = parse_xml(archive, "content.xml")
        styles = parse_xml(archive, "styles.xml")

    if content is None:
        raise SystemExit("content.xml not found")

    slides = []
    shape_counts: Counter[str] = Counter()
    media_refs: set[str] = set()

    for index, page in enumerate(content.findall(".//draw:page", NS), start=1):
        notes = page.find("presentation:notes", NS)
        for node in page.iter():
            if node.tag.startswith(f"{{{NS['draw']}}}"):
                shape_counts[node.tag.split("}", 1)[1]] += 1
            href = node.attrib.get(qname("xlink", "href"))
            if href:
                media_refs.add(href)

        slides.append(
            {
                "index": index,
                "name": page.attrib.get(qname("draw", "name")),
                "master_page": page.attrib.get(qname("draw", "master-page-name")),
                "style": page.attrib.get(qname("draw", "style-name")),
                "layout": page.attrib.get(qname("presentation", "presentation-page-layout-name")),
                "has_notes": notes is not None and any(True for _ in notes.iter(qname("text", "p"))),
                "frames": len(page.findall(".//draw:frame", NS)),
                "images": len(page.findall(".//draw:image", NS)),
            }
        )

    masters = []
    if styles is not None:
        for master in styles.findall(".//style:master-page", NS):
            masters.append(
                {
                    "name": master.attrib.get(qname("style", "name")),
                    "page_layout": master.attrib.get(qname("style", "page-layout-name")),
                    "frames": len(master.findall(".//draw:frame", NS)),
                    "images": len(master.findall(".//draw:image", NS)),
                }
            )

    return {
        "file": str(path),
        "entries": len(names),
        "has_mimetype_first": bool(names and names[0] == "mimetype"),
        "package_files": [
            name
            for name in names
            if name in {"content.xml", "styles.xml", "meta.xml", "settings.xml", "META-INF/manifest.xml"}
        ],
        "media_files": [name for name in names if name.startswith("Pictures/")],
        "media_refs": sorted(media_refs),
        "slide_count": len(slides),
        "slides": slides,
        "master_pages": masters,
        "draw_element_counts": dict(sorted(shape_counts.items())),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("odp", type=Path)
    args = parser.parse_args()
    print(json.dumps(summarize(args.odp), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
