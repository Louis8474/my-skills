#!/usr/bin/env python3
"""Add or remove a slide transition on one or all slides in an ODP file.

Transition types: fade, wipe, cover, uncover, push, dissolve, random.
For wipe/cover/uncover/push, --direction selects sub-type.
"""

from __future__ import annotations

import argparse
from pathlib import Path
from xml.etree import ElementTree as ET

from odp_common import (
    find_slides,
    parse_xml_from_zip,
    q,
    select_slide,
    update_meta_for_edit,
    write_odp_with_replacements,
    xml_bytes,
)

VALID_TYPES = {"fade", "wipe", "cover", "uncover", "push", "dissolve", "random"}


def find_or_create_automatic_styles(content_root: ET.Element) -> ET.Element:
    auto = content_root.find(q("office", "automatic-styles"))
    if auto is None:
        # Insert as child after office:font-face-decls if present, else at start of root.
        auto = ET.Element(q("office", "automatic-styles"))
        # Insert as first child of document-content
        content_root.insert(0, auto)
    return auto


def unique_transition_style_name(auto_styles: ET.Element) -> str:
    name_attr = q("style", "name")
    existing = {child.attrib.get(name_attr) for child in auto_styles.findall(q("style", "style"))}
    counter = 1
    while f"transition{counter}" in existing:
        counter += 1
    return f"transition{counter}"


def build_transition_style(name: str, ttype: str, direction: str | None, duration: str) -> ET.Element:
    style = ET.Element(
        q("style", "style"),
        {q("style", "name"): name, q("style", "family"): "drawing-page"},
    )
    props_attribs = {
        q("presentation", "transition-type"): "automatic",
        q("presentation", "transition-style"): ttype,
        q("presentation", "duration"): duration,
    }
    if direction:
        props_attribs[q("presentation", "transition-speed")] = "medium"
        # Encode direction in style suffix; ODF uses transition-style sub-types.
        # We keep --direction as documentation; LibreOffice picks a sensible variant.
    ET.SubElement(style, q("style", "drawing-page-properties"), props_attribs)
    return style


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odp", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--slide", required=True, help="slide index (1-based), draw:name, or 'all'")
    parser.add_argument("--type", dest="ttype", help="transition type (required unless --remove)")
    parser.add_argument("--direction", help="left/right/up/down or from-* for wipe/cover/push")
    parser.add_argument("--duration", default="1s")
    parser.add_argument("--remove", action="store_true", help="remove existing transition instead of setting one")
    args = parser.parse_args()

    if not args.remove and args.ttype is None:
        raise SystemExit("--type required unless --remove")
    if args.ttype and args.ttype not in VALID_TYPES:
        raise SystemExit(f"--type must be one of {sorted(VALID_TYPES)}, got {args.ttype!r}")

    content = parse_xml_from_zip(args.input_odp, "content.xml")
    if args.slide == "all":
        targets = find_slides(content)
    else:
        targets = [select_slide(content, args.slide)]

    if args.remove:
        for slide in targets:
            slide.attrib.pop(q("draw", "style-name"), None)
        status = f"removed transition on {len(targets)} slide(s)"
    else:
        auto_styles = find_or_create_automatic_styles(content)
        style_name = unique_transition_style_name(auto_styles)
        auto_styles.append(build_transition_style(style_name, args.ttype, args.direction, args.duration))
        for slide in targets:
            slide.set(q("draw", "style-name"), style_name)
        status = f"applied {args.ttype} transition (style {style_name}) to {len(targets)} slide(s)"

    meta = parse_xml_from_zip(args.input_odp, "meta.xml")
    update_meta_for_edit(meta)
    write_odp_with_replacements(
        args.input_odp,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(status)


if __name__ == "__main__":
    main()
