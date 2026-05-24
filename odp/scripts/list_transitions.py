#!/usr/bin/env python3
"""List slide transitions in an ODP file as JSON."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from xml.etree import ElementTree as ET

from odp_common import find_slides, parse_xml_from_zip, q


def collect(content_root: ET.Element) -> list[dict[str, object]]:
    # Build style-name → drawing-page-properties lookup.
    style_props: dict[str, dict[str, str]] = {}
    for style in content_root.iter(q("style", "style")):
        if style.attrib.get(q("style", "family")) != "drawing-page":
            continue
        name = style.attrib.get(q("style", "name"))
        if not name:
            continue
        props_el = style.find(q("style", "drawing-page-properties"))
        if props_el is None:
            continue
        style_props[name] = {k.rsplit("}", 1)[-1]: v for k, v in props_el.attrib.items()}

    results: list[dict[str, object]] = []
    for idx, slide in enumerate(find_slides(content_root), start=1):
        style_name = slide.attrib.get(q("draw", "style-name"))
        if not style_name or style_name not in style_props:
            continue
        props = style_props[style_name]
        if "transition-style" not in props:
            continue
        results.append(
            {
                "slide": idx,
                "slide_name": slide.attrib.get(q("draw", "name")),
                "type": props.get("transition-style"),
                "duration": props.get("duration"),
                "style_name": style_name,
            }
        )
    return results


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odp", type=Path)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    content = parse_xml_from_zip(args.input_odp, "content.xml")
    data = collect(content)
    if args.json:
        print(json.dumps(data, ensure_ascii=False, indent=2))
        return
    for entry in data:
        print(f"slide {entry['slide']}: {entry['type']} ({entry['duration']})")


if __name__ == "__main__":
    main()
