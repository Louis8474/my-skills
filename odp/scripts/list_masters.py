#!/usr/bin/env python3
"""List ODP master pages, layouts, placeholders, and slide usage."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from pathlib import Path

from odp_common import NS, parse_xml_from_zip, q


def summarize(path: Path) -> dict[str, object]:
    content = parse_xml_from_zip(path, "content.xml")
    styles = parse_xml_from_zip(path, "styles.xml")

    usage: Counter[str] = Counter()
    slides = []
    for index, page in enumerate(content.findall(".//draw:page", NS), start=1):
        master_name = page.attrib.get(q("draw", "master-page-name"), "")
        usage[master_name] += 1
        slides.append(
            {
                "index": index,
                "name": page.attrib.get(q("draw", "name")),
                "master_page": master_name,
                "layout": page.attrib.get(q("presentation", "presentation-page-layout-name")),
            }
        )

    masters = []
    for master in styles.findall(".//style:master-page", NS):
        name = master.attrib.get(q("style", "name"), "")
        placeholders = []
        for node in master.iter():
            klass = node.attrib.get(q("presentation", "class"))
            if klass:
                placeholders.append(klass)
        masters.append(
            {
                "name": name,
                "page_layout": master.attrib.get(q("style", "page-layout-name")),
                "slides_using": usage.get(name, 0),
                "frames": len(master.findall(".//draw:frame", NS)),
                "images": len(master.findall(".//draw:image", NS)),
                "placeholders": sorted(set(placeholders)),
            }
        )

    return {"master_pages": masters, "slides": slides}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("odp", type=Path)
    args = parser.parse_args()
    print(json.dumps(summarize(args.odp), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
