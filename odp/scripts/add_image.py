#!/usr/bin/env python3
"""Add an image frame to an ODP slide and update the manifest."""

from __future__ import annotations

import argparse
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from odp_common import (
    copy_into_package,
    ensure_manifest_entry,
    parse_xml_from_zip,
    q,
    select_slide,
    sniff_image_mime,
    unique_picture_name,
    update_meta_for_edit,
    xml_bytes,
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odp", type=Path)
    parser.add_argument("image", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--slide", help="slide index (1-based) or draw:name; default first slide")
    parser.add_argument("--x", default="2cm")
    parser.add_argument("--y", default="3cm")
    parser.add_argument("--width", default="10cm")
    parser.add_argument("--height", default="7cm")
    parser.add_argument("--name", default="Image")
    args = parser.parse_args()

    content = parse_xml_from_zip(args.input_odp, "content.xml")
    manifest = parse_xml_from_zip(args.input_odp, "META-INF/manifest.xml")
    page = select_slide(content, args.slide)

    with zipfile.ZipFile(args.input_odp) as archive:
        existing = set(archive.namelist())
    package_path = unique_picture_name(existing, args.image)

    frame = ET.SubElement(
        page,
        q("draw", "frame"),
        {
            q("draw", "name"): args.name,
            q("svg", "x"): args.x,
            q("svg", "y"): args.y,
            q("svg", "width"): args.width,
            q("svg", "height"): args.height,
        },
    )
    ET.SubElement(
        frame,
        q("draw", "image"),
        {
            q("xlink", "href"): package_path,
            q("xlink", "type"): "simple",
            q("xlink", "show"): "embed",
            q("xlink", "actuate"): "onLoad",
        },
    )

    ensure_manifest_entry(manifest, package_path, sniff_image_mime(args.image))
    meta = parse_xml_from_zip(args.input_odp, "meta.xml")
    update_meta_for_edit(meta)
    copy_into_package(
        args.input_odp,
        args.output,
        package_path,
        args.image,
        {
            "content.xml": xml_bytes(content),
            "META-INF/manifest.xml": xml_bytes(manifest),
            "meta.xml": xml_bytes(meta),
        },
    )
    print(package_path)


if __name__ == "__main__":
    main()
