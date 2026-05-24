#!/usr/bin/env python3
"""Add a draw:glue-point to an ODG shape.

Glue points are anchor positions that draw:connector elements can snap to.
Each shape can have multiple glue points with unique IDs. The default four
edge midpoints (top, right, bottom, left) are reserved at IDs 0-3 by
LibreOffice; user-defined glue points start at ID 4.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

from odg_common import (
    ensure_shape_id,
    find_shape_by_name,
    iter_glue_points,
    parse_xml_from_zip,
    q,
    update_meta_for_edit,
    write_odg_with_replacements,
    xml_bytes,
)

VALID_ESCAPE = {"up", "down", "left", "right", "auto", "horizontal", "vertical"}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input_odg", type=Path)
    parser.add_argument("-o", "--output", type=Path, required=True)
    parser.add_argument("--shape", required=True, help="target draw:name")
    parser.add_argument("--position", required=True, help="X,Y relative to shape size (e.g. '0.5,0' for top-center)")
    parser.add_argument(
        "--escape", default="auto", choices=sorted(VALID_ESCAPE), help="escape direction for connector routing"
    )
    parser.add_argument("--id", help="explicit glue-point id (default: auto from 4)")
    args = parser.parse_args()

    try:
        x_str, y_str = args.position.split(",", 1)
        x = float(x_str.strip())
        y = float(y_str.strip())
    except ValueError:
        raise SystemExit(f"--position must be 'X,Y' (numbers), got {args.position!r}")

    content = parse_xml_from_zip(args.input_odg, "content.xml")
    shape = find_shape_by_name(content, args.shape)
    if shape is None:
        print(f"warning: shape {args.shape!r} not found; no glue point added", file=sys.stderr)
        write_odg_with_replacements(args.input_odg, args.output, {})
        return

    ensure_shape_id(shape, content)
    existing_ids = {gp.attrib.get(q("draw", "id")) for gp in iter_glue_points(shape)}
    if args.id:
        gp_id = args.id
        if gp_id in existing_ids:
            raise SystemExit(f"glue-point id {gp_id!r} already exists on shape {args.shape!r}")
    else:
        counter = 4
        while str(counter) in existing_ids:
            counter += 1
        gp_id = str(counter)

    ET.SubElement(
        shape,
        q("draw", "glue-point"),
        {
            q("draw", "id"): gp_id,
            q("svg", "x"): f"{x}",
            q("svg", "y"): f"{y}",
            q("draw", "escape-direction"): args.escape,
            q("draw", "align"): "top-left",
        },
    )

    meta = parse_xml_from_zip(args.input_odg, "meta.xml")
    update_meta_for_edit(meta)
    write_odg_with_replacements(
        args.input_odg,
        args.output,
        {"content.xml": xml_bytes(content), "meta.xml": xml_bytes(meta)},
    )
    print(gp_id)


if __name__ == "__main__":
    main()
