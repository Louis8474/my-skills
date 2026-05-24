#!/usr/bin/env python3
"""Extract ODG shapes with page, geometry, style, and text."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from odg_common import element_text, iter_pages, iter_shapes, local_name, page_name, parse_xml_from_zip, q

GEOM_ATTRS = ["x", "y", "width", "height", "x1", "y1", "x2", "y2"]


def extract(path: Path) -> list[dict[str, object]]:
    root = parse_xml_from_zip(path, "content.xml")
    shapes = []
    for page_index, page in enumerate(iter_pages(root), start=1):
        for node in iter_shapes(page):
            shape = {
                "page": page_index,
                "page_name": page_name(page),
                "type": local_name(node.tag),
                "name": node.attrib.get(q("draw", "name")),
                "style": node.attrib.get(q("draw", "style-name")),
                "text_style": node.attrib.get(q("draw", "text-style-name")),
                "text": element_text(node),
            }
            for attr in GEOM_ATTRS:
                value = node.attrib.get(q("svg", attr))
                if value is not None:
                    shape[attr] = value
            shapes.append(shape)
    return shapes


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("odg", type=Path)
    args = parser.parse_args()
    print(json.dumps(extract(args.odg), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
