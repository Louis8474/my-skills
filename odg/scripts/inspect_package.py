#!/usr/bin/env python3
"""Inspect the structure, pages, media, styles, and package entries of an ODG file."""

from __future__ import annotations

import argparse
import json
import zipfile
from collections import Counter
from pathlib import Path

from odg_common import NS, iter_pages, iter_shapes, local_name, parse_xml_from_zip, q


def summarize(path: Path) -> dict[str, object]:
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
    content = parse_xml_from_zip(path, "content.xml")
    styles = parse_xml_from_zip(path, "styles.xml") if "styles.xml" in names else None
    media_refs = set()
    counts: Counter[str] = Counter()
    for node in content.iter():
        if node.tag.startswith("{"):
            counts[local_name(node.tag)] += 1
        href = node.attrib.get(q("xlink", "href"))
        if href:
            media_refs.add(href)
    pages = []
    for index, page in enumerate(iter_pages(content), start=1):
        shape_counts = Counter(local_name(shape.tag) for shape in iter_shapes(page))
        pages.append(
            {"index": index, "name": page.attrib.get(q("draw", "name")), "shapes": dict(sorted(shape_counts.items()))}
        )
    style_counts: Counter[str] = Counter()
    if styles is not None:
        for style in styles.findall(".//style:style", NS):
            style_counts[style.attrib.get(q("style", "family"), "unknown")] += 1
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
        "pages": pages,
        "element_counts": dict(sorted(counts.items())),
        "style_counts": dict(sorted(style_counts.items())),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("odg", type=Path)
    args = parser.parse_args()
    print(json.dumps(summarize(args.odg), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
