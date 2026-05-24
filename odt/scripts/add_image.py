#!/usr/bin/env python3
"""Add an image paragraph to an ODT file and update the manifest."""

from __future__ import annotations

import argparse
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

from odt_common import (
    copy_into_package,
    ensure_manifest_entry,
    parse_xml_from_zip,
    q,
    sniff_image_mime,
    unique_picture_name,
    update_meta_for_edit,
    xml_bytes,
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odt", type=Path)
    parser.add_argument("image", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--width", default="8cm")
    parser.add_argument("--height", default="5cm")
    parser.add_argument("--name", default="Image")
    args = parser.parse_args()

    content = parse_xml_from_zip(args.input_odt, "content.xml")
    manifest = parse_xml_from_zip(args.input_odt, "META-INF/manifest.xml")
    body = content.find(".//office:text", {"office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0"})
    if body is None:
        raise SystemExit("office:text not found")

    with zipfile.ZipFile(args.input_odt) as archive:
        existing = set(archive.namelist())
    package_path = unique_picture_name(existing, args.image)

    paragraph = ET.SubElement(body, q("text", "p"))
    frame = ET.SubElement(
        paragraph,
        q("draw", "frame"),
        {
            q("draw", "name"): args.name,
            q("text", "anchor-type"): "paragraph",
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
    meta = parse_xml_from_zip(args.input_odt, "meta.xml")
    update_meta_for_edit(meta)
    copy_into_package(
        args.input_odt,
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
