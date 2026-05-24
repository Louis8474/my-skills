#!/usr/bin/env python3
"""Validate core ODG package, media, style references, and basic geometry."""

from __future__ import annotations

import argparse
import json
import re
import zipfile
from pathlib import Path

from odg_common import NS, iter_pages, iter_shapes, parse_xml_from_zip, q


def numeric_unit(value: str | None) -> float | None:
    if value is None:
        return None
    match = re.match(r"^(-?[0-9]+(?:\.[0-9]+)?)", value)
    return float(match.group(1)) if match else None


def validate(path: Path) -> dict[str, object]:
    errors: list[str] = []
    warnings: list[str] = []
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
    required = {"mimetype", "content.xml", "styles.xml", "meta.xml", "settings.xml", "META-INF/manifest.xml"}
    for name in sorted(required - set(names)):
        errors.append(f"Missing package file: {name}")
    if names and names[0] != "mimetype":
        errors.append("mimetype is not the first ZIP entry")
    if "content.xml" not in names:
        return {"status": "errors_found", "errors": errors, "warnings": warnings}
    content = parse_xml_from_zip(path, "content.xml")
    manifest = parse_xml_from_zip(path, "META-INF/manifest.xml") if "META-INF/manifest.xml" in names else None
    manifest_paths = set()
    if manifest is not None:
        manifest_paths = {
            e.attrib.get(q("manifest", "full-path")) for e in manifest.findall(".//manifest:file-entry", NS)
        }
    for node in content.iter():
        href = node.attrib.get(q("xlink", "href"))
        if href and not href.startswith("#") and "://" not in href:
            package_path = href.lstrip("./")
            if package_path not in names:
                errors.append(f"Missing package media target: {href}")
            if manifest_paths and package_path not in manifest_paths:
                warnings.append(f"Media target not listed in manifest: {package_path}")
    for page_idx, page in enumerate(iter_pages(content), start=1):
        for shape in iter_shapes(page):
            width = numeric_unit(shape.attrib.get(q("svg", "width")))
            height = numeric_unit(shape.attrib.get(q("svg", "height")))
            if width == 0 or height == 0:
                warnings.append(f"Page {page_idx} has zero-size shape")
            if width is not None and width < 0 or height is not None and height < 0:
                errors.append(f"Page {page_idx} has negative-size shape")

    # Build shape-id → glue-point-ids map and connector inventory
    shape_glue_points: dict[str, set[str]] = {}
    all_ids: dict[str, int] = {}
    for el in content.iter():
        eid = el.attrib.get(q("draw", "id"))
        if eid:
            all_ids[eid] = all_ids.get(eid, 0) + 1
        # If this element has glue points, record their ids per shape
        gps = list(el.findall(q("draw", "glue-point")))
        if gps and eid:
            gp_ids = [gp.attrib.get(q("draw", "id")) for gp in gps]
            seen: set[str] = set()
            for g in gp_ids:
                if g and g in seen:
                    errors.append(f"Duplicate glue-point id {g!r} on shape {eid!r}")
                if g:
                    seen.add(g)
            shape_glue_points[eid] = seen

    # Connector targets and glue-point references
    for connector in content.iter(q("draw", "connector")):
        start_shape = connector.attrib.get(q("draw", "start-shape"))
        end_shape = connector.attrib.get(q("draw", "end-shape"))
        start_glue = connector.attrib.get(q("draw", "start-glue-point"))
        end_glue = connector.attrib.get(q("draw", "end-glue-point"))
        if start_shape and start_shape not in all_ids:
            errors.append(f"Connector references missing start-shape draw:id: {start_shape}")
        if end_shape and end_shape not in all_ids:
            errors.append(f"Connector references missing end-shape draw:id: {end_shape}")
        # Glue-point IDs 0..3 are LibreOffice's built-in edge midpoints — always valid.
        if start_glue and start_shape in shape_glue_points:
            valid = shape_glue_points[start_shape] | {"0", "1", "2", "3"}
            if start_glue not in valid:
                errors.append(f"Connector references missing glue-point {start_glue!r} on {start_shape!r}")
        if end_glue and end_shape in shape_glue_points:
            valid = shape_glue_points[end_shape] | {"0", "1", "2", "3"}
            if end_glue not in valid:
                errors.append(f"Connector references missing glue-point {end_glue!r} on {end_shape!r}")

    # Empty groups
    for group in content.iter(q("draw", "g")):
        if len(list(group)) == 0:
            warnings.append(f"Empty draw:g group (name: {group.attrib.get(q('draw', 'name')) or '?'})")

    return {
        "status": "ok" if not errors else "errors_found",
        "errors": sorted(set(errors)),
        "warnings": sorted(set(warnings)),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("odg", type=Path)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="also validate content.xml and META-INF/manifest.xml against the OASIS ODF 1.3 RelaxNG schemas (requires lxml; install via `pip install open-document-lib[validate]`)",
    )
    args = parser.parse_args()
    result = validate(args.odg)
    if args.strict:
        # odg_common (imported above) has already put odf_lib on sys.path.
        from odf_lib.odf_common import apply_strict_schema_check

        apply_strict_schema_check(args.odg, result)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if result["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
