#!/usr/bin/env python3
"""Validate core ODP package, media, master-page, and style references."""

from __future__ import annotations

import argparse
import json
import zipfile
from pathlib import Path

from odp_common import NS, parse_xml_from_zip, q


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

    if "content.xml" not in names or "styles.xml" not in names:
        return {"status": "errors_found", "errors": errors, "warnings": warnings}

    content = parse_xml_from_zip(path, "content.xml")
    styles = parse_xml_from_zip(path, "styles.xml")
    manifest = parse_xml_from_zip(path, "META-INF/manifest.xml") if "META-INF/manifest.xml" in names else None

    masters = {m.attrib.get(q("style", "name")) for m in styles.findall(".//style:master-page", NS)}
    styles_defined = {
        s.attrib.get(q("style", "name"))
        for s in list(styles.findall(".//style:style", NS)) + list(content.findall(".//style:style", NS))
    }
    manifest_paths = set()
    if manifest is not None:
        manifest_paths = {
            e.attrib.get(q("manifest", "full-path")) for e in manifest.findall(".//manifest:file-entry", NS)
        }

    for index, page in enumerate(content.findall(".//draw:page", NS), start=1):
        master = page.attrib.get(q("draw", "master-page-name"))
        if master and master not in masters:
            errors.append(f"Slide {index} references missing master page: {master}")
        style = page.attrib.get(q("draw", "style-name"))
        if style and style not in styles_defined:
            warnings.append(f"Slide {index} references unknown draw style: {style}")

    for node in content.iter():
        href = node.attrib.get(q("xlink", "href"))
        if not href or href.startswith("#") or "://" in href:
            continue
        package_path = href.lstrip("./")
        if package_path.endswith("/"):
            continue
        if package_path not in names:
            errors.append(f"Missing package media target: {href}")
        if manifest_paths and package_path not in manifest_paths:
            warnings.append(f"Media target not listed in manifest: {package_path}")

    # Animation target consistency: every smil:targetElement must reference an existing draw:id.
    draw_ids: dict[str, int] = {}
    for el in content.iter():
        eid = el.attrib.get(q("draw", "id"))
        if eid:
            draw_ids[eid] = draw_ids.get(eid, 0) + 1
    for eid, count in draw_ids.items():
        if count > 1:
            errors.append(f"Duplicate draw:id {eid!r} ({count} occurrences)")
    for el in content.iter():
        target = el.attrib.get(q("smil", "targetElement"))
        if target and target not in draw_ids:
            errors.append(f"Animation references missing draw:id: {target}")

    return {
        "status": "ok" if not errors else "errors_found",
        "errors": errors,
        "warnings": warnings,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("odp", type=Path)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="also validate content.xml and META-INF/manifest.xml against the OASIS ODF 1.3 RelaxNG schemas (requires lxml; install via `pip install open-document-lib[validate]`)",
    )
    args = parser.parse_args()
    result = validate(args.odp)
    if args.strict:
        # odp_common (imported above) has already put odf_lib on sys.path.
        from odf_lib.odf_common import apply_strict_schema_check

        apply_strict_schema_check(args.odp, result)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if result["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
