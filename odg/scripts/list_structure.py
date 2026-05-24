#!/usr/bin/env python3
"""List groups, connectors, and glue points in an ODG file as JSON."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

from odg_common import (
    iter_glue_points,
    iter_pages,
    page_name,
    parse_xml_from_zip,
    q,
)


def collect(content_root: ET.Element) -> dict[str, Any]:
    # id → name lookup for connectors
    id_to_name: dict[str, str] = {}
    for el in content_root.iter():
        eid = el.attrib.get(q("draw", "id"))
        if eid:
            id_to_name[eid] = el.attrib.get(q("draw", "name"), eid)

    pages_data: list[dict[str, Any]] = []
    for page in iter_pages(content_root):
        page_entry: dict[str, Any] = {
            "name": page_name(page),
            "groups": [],
            "connectors": [],
            "glue_points": [],
        }
        for child in page:
            if child.tag == q("draw", "g"):
                page_entry["groups"].append(
                    {
                        "name": child.attrib.get(q("draw", "name")),
                        "shape_count": len([s for s in child if s.tag.startswith("{") and "drawing" in s.tag]),
                    }
                )
            elif child.tag == q("draw", "connector"):
                from_id = child.attrib.get(q("draw", "start-shape"))
                to_id = child.attrib.get(q("draw", "end-shape"))
                page_entry["connectors"].append(
                    {
                        "name": child.attrib.get(q("draw", "name")),
                        "type": child.attrib.get(q("draw", "type")),
                        "from": id_to_name.get(from_id or "", from_id),
                        "to": id_to_name.get(to_id or "", to_id),
                        "from_glue": child.attrib.get(q("draw", "start-glue-point")),
                        "to_glue": child.attrib.get(q("draw", "end-glue-point")),
                    }
                )
        # Glue points: scan all descendants
        for el in page.iter():
            for gp in iter_glue_points(el):
                page_entry["glue_points"].append(
                    {
                        "shape": el.attrib.get(q("draw", "name")) or el.attrib.get(q("draw", "id")),
                        "id": gp.attrib.get(q("draw", "id")),
                        "x": gp.attrib.get(q("svg", "x")),
                        "y": gp.attrib.get(q("svg", "y")),
                        "escape": gp.attrib.get(q("draw", "escape-direction")),
                    }
                )
        pages_data.append(page_entry)

    return {"pages": pages_data}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odg", type=Path)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    content = parse_xml_from_zip(args.input_odg, "content.xml")
    data = collect(content)
    if args.json:
        print(json.dumps(data, ensure_ascii=False, indent=2))
        return
    for page in data["pages"]:
        print(f"Page: {page['name']}")
        for g in page["groups"]:
            print(f"  group: {g['name']} ({g['shape_count']} shapes)")
        for c in page["connectors"]:
            print(f"  connector: {c['from']} → {c['to']} ({c['type']})")
        for gp in page["glue_points"]:
            print(f"  glue: shape={gp['shape']} id={gp['id']} at ({gp['x']},{gp['y']})")


if __name__ == "__main__":
    main()
