#!/usr/bin/env python3
"""Inspect the structure, media, styles, charts, and package entries of an ODS file."""

from __future__ import annotations

import argparse
import json
import zipfile
from collections import Counter
from pathlib import Path

from ods_common import NS, expanded_rows, iter_sheets, parse_xml_from_zip, q, sheet_name


def summarize(path: Path) -> dict[str, object]:
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
    content = parse_xml_from_zip(path, "content.xml")
    styles = parse_xml_from_zip(path, "styles.xml") if "styles.xml" in names else None
    media_refs = set()
    counts: Counter[str] = Counter()
    formulas = 0
    for node in content.iter():
        if node.tag.startswith("{"):
            counts[node.tag.split("}", 1)[1]] += 1
        href = node.attrib.get(q("xlink", "href"))
        if href:
            media_refs.add(href)
        if node.attrib.get(q("table", "formula")):
            formulas += 1
    sheets = []
    for sheet in iter_sheets(content):
        rows = expanded_rows(sheet)
        sheets.append({"name": sheet_name(sheet), "rows": len(rows), "columns": max((len(r) for r in rows), default=0)})
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
        "media_files": [name for name in names if name.startswith("Pictures/") or name.startswith("Object")],
        "media_refs": sorted(media_refs),
        "sheets": sheets,
        "formulas": formulas,
        "element_counts": dict(sorted(counts.items())),
        "style_counts": dict(sorted(style_counts.items())),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ods", type=Path)
    args = parser.parse_args()
    print(json.dumps(summarize(args.ods), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
