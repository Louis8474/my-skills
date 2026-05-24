#!/usr/bin/env python3
"""Connect two shapes with a draw:connector.

Supports automatic shape-to-shape binding (LibreOffice picks the best glue
points) or explicit glue-point IDs. Three connector types: standard
(orthogonal-routed), line (straight), curve (bezier).
"""

from __future__ import annotations

import argparse
from pathlib import Path
from xml.etree import ElementTree as ET

from odg_common import (
    ensure_shape_id,
    find_shape_by_name,
    iter_pages,
    parse_xml_from_zip,
    q,
    update_meta_for_edit,
    write_odg_with_replacements,
    xml_bytes,
)

VALID_TYPES = {"standard", "line", "curve"}


def find_shape_on_page(page: ET.Element, name: str) -> ET.Element | None:
    return find_shape_by_name(page, name)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odg", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--from", dest="from_shape", required=True, help="source draw:name")
    parser.add_argument("--to", dest="to_shape", required=True, help="target draw:name")
    parser.add_argument("--from-glue", help="source glue-point id (default: auto)")
    parser.add_argument("--to-glue", help="target glue-point id (default: auto)")
    parser.add_argument("--type", dest="ctype", default="standard", choices=sorted(VALID_TYPES))
    parser.add_argument("--line-width", default="0.025cm")
    parser.add_argument("--name", help="draw:name on the connector itself")
    parser.add_argument("--page", type=int, default=1, help="1-based page index")
    args = parser.parse_args()

    content = parse_xml_from_zip(args.input_odg, "content.xml")
    pages = list(iter_pages(content))
    if args.page < 1 or args.page > len(pages):
        raise SystemExit(f"page index out of range: {args.page} (have {len(pages)})")
    page = pages[args.page - 1]

    from_el = find_shape_on_page(page, args.from_shape)
    to_el = find_shape_on_page(page, args.to_shape)
    if from_el is None:
        raise SystemExit(f"shape {args.from_shape!r} not found on page {args.page}")
    if to_el is None:
        raise SystemExit(f"shape {args.to_shape!r} not found on page {args.page}")

    from_id = ensure_shape_id(from_el, content)
    to_id = ensure_shape_id(to_el, content)

    connector_attribs: dict[str, str] = {
        q("draw", "type"): args.ctype,
        q("draw", "start-shape"): from_id,
        q("draw", "end-shape"): to_id,
        q("svg", "x1"): "0cm",
        q("svg", "y1"): "0cm",
        q("svg", "x2"): "1cm",
        q("svg", "y2"): "1cm",
    }
    if args.from_glue is not None:
        connector_attribs[q("draw", "start-glue-point")] = args.from_glue
    if args.to_glue is not None:
        connector_attribs[q("draw", "end-glue-point")] = args.to_glue
    if args.name:
        connector_attribs[q("draw", "name")] = args.name

    connector = ET.SubElement(page, q("draw", "connector"), connector_attribs)
    del connector

    meta = parse_xml_from_zip(args.input_odg, "meta.xml")
    update_meta_for_edit(meta)
    write_odg_with_replacements(
        args.input_odg,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(f"{args.from_shape} → {args.to_shape}")


if __name__ == "__main__":
    main()
