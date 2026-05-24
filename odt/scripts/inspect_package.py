#!/usr/bin/env python3
"""Inspect the structure, media, styles, and package entries of an ODT file."""

from __future__ import annotations

import argparse
import json
import zipfile
from collections import Counter
from pathlib import Path

from odt_common import NS, parse_xml_from_zip, q


def summarize(path: Path) -> dict[str, object]:
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()

    content = parse_xml_from_zip(path, "content.xml")
    styles = parse_xml_from_zip(path, "styles.xml") if "styles.xml" in names else None
    counts: Counter[str] = Counter()
    media_refs: set[str] = set()
    for node in content.iter():
        if node.tag.startswith("{"):
            counts[node.tag.split("}", 1)[1]] += 1
        href = node.attrib.get(q("xlink", "href"))
        if href:
            media_refs.add(href)

    style_counts: Counter[str] = Counter()
    if styles is not None:
        for style in styles.findall(".//style:style", NS):
            family = style.attrib.get(q("style", "family"), "unknown")
            style_counts[family] += 1

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
        "element_counts": dict(sorted(counts.items())),
        "style_counts": dict(sorted(style_counts.items())),
        "headings": len(content.findall(".//text:h", NS)),
        "paragraphs": len(content.findall(".//text:p", NS)),
        "lists": len(content.findall(".//text:list", NS)),
        "tables": len(content.findall(".//table:table", NS)),
        "images": len(content.findall(".//draw:image", NS)),
        "notes": len(content.findall(".//text:note", NS)),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("odt", type=Path)
    args = parser.parse_args()
    print(json.dumps(summarize(args.odt), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
