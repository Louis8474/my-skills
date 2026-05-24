#!/usr/bin/env python3
"""List all shape-level animations in an ODP file as JSON."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from xml.etree import ElementTree as ET

from odp_common import find_slides, parse_xml_from_zip, q


def collect(content_root: ET.Element) -> list[dict[str, object]]:
    # Build draw:id → draw:name lookup
    id_to_name: dict[str, str] = {}
    for el in content_root.iter():
        eid = el.attrib.get(q("draw", "id"))
        if eid:
            id_to_name[eid] = el.attrib.get(q("draw", "name"), "")

    results: list[dict[str, object]] = []
    for idx, slide in enumerate(find_slides(content_root), start=1):
        # Locate timing root(s)
        for outer in slide.findall(q("anim", "par")):
            if outer.attrib.get(q("presentation", "node-type")) != "timing-root":
                continue
            for anim_par in outer.findall(q("anim", "par")):
                preset_id = anim_par.attrib.get(q("presentation", "preset-id"))
                preset_class = anim_par.attrib.get(q("presentation", "preset-class"))
                sub_type = anim_par.attrib.get(q("presentation", "preset-sub-type"))
                trigger = anim_par.attrib.get(q("presentation", "node-type"))
                # Find target shape via the first smil:targetElement under this anim_par.
                target_id: str | None = None
                duration: str | None = None
                for descendant in anim_par.iter():
                    if descendant is anim_par:
                        continue
                    if target_id is None and descendant.attrib.get(q("smil", "targetElement")):
                        target_id = descendant.attrib.get(q("smil", "targetElement"))
                    if duration is None and descendant.attrib.get(q("smil", "dur")):
                        duration = descendant.attrib.get(q("smil", "dur"))
                    if target_id and duration:
                        break
                results.append(
                    {
                        "slide": idx,
                        "shape": id_to_name.get(target_id or "", target_id),
                        "shape_id": target_id,
                        "preset_id": preset_id,
                        "preset_class": preset_class,
                        "sub_type": sub_type,
                        "trigger": trigger,
                        "duration": duration,
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
        print(
            f"slide {entry['slide']}: [{entry['preset_class']}] {entry['preset_id']} "
            f"on shape {entry['shape']!r} ({entry['duration']})"
        )


if __name__ == "__main__":
    main()
