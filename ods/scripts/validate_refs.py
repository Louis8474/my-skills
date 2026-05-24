#!/usr/bin/env python3
"""Validate core ODS package, media, manifest, formulas, and style references."""

from __future__ import annotations

import argparse
import json
import zipfile
from pathlib import Path

from ods_common import NS, parse_xml_from_zip, q

ERROR_MARKERS = ("#REF!", "#DIV/0!", "#VALUE!", "#NAME?", "#N/A", "Err:")


def validate(path: Path) -> dict[str, object]:
    errors: list[str] = []
    warnings: list[str] = []
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
    required = {"mimetype", "content.xml", "styles.xml", "meta.xml", "settings.xml", "META-INF/manifest.xml"}
    for missing in sorted(required - set(names)):
        errors.append(f"Missing package file: {missing}")
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
            # Sub-package object references (e.g. './Object 1' / './Object 1/')
            # resolve via directory contents — validated in the draw:object loop.
            is_object_ref = node.tag == q("draw", "object")
            # ObjectReplacements/* is LibreOffice's optional preview-bitmap cache.
            is_replacement = package_path.startswith("ObjectReplacements/")
            if package_path.endswith("/") or is_object_ref:
                pass
            elif is_replacement:
                if package_path not in names:
                    warnings.append(f"Missing object-replacement preview: {package_path}")
            else:
                if package_path not in names:
                    errors.append(f"Missing package media target: {href}")
                if manifest_paths and package_path not in manifest_paths:
                    warnings.append(f"Media target not listed in manifest: {package_path}")
        formula = node.attrib.get(q("table", "formula"))
        if formula and "#REF!" in formula:
            errors.append(f"Formula contains #REF!: {formula}")
        text = "".join(p.text or "" for p in node.findall(".//text:p", NS))
        if any(marker in text for marker in ERROR_MARKERS):
            errors.append(f"Cell displays formula error: {text}")

    # Named range and named expression checks
    sheet_names: set[str] = set()
    for sheet in content.findall(".//table:table", NS):
        sn = sheet.attrib.get(q("table", "name"))
        if sn:
            sheet_names.add(sn)
    name_counts: dict[str, int] = {}
    for nr in content.iter(q("table", "named-range")):
        name = nr.attrib.get(q("table", "name"))
        addr = nr.attrib.get(q("table", "cell-range-address"), "")
        if name:
            name_counts[name] = name_counts.get(name, 0) + 1
        # Address shape: '$Sheet.$A1:.$B2' — extract sheet name from leading '$Sheet.'.
        if addr.startswith("$") and "." in addr:
            sheet_part = addr[1:].split(".", 1)[0]
            if sheet_part not in sheet_names:
                errors.append(f"Named range {name!r} references unknown sheet {sheet_part!r}")
    for ne in content.iter(q("table", "named-expression")):
        name = ne.attrib.get(q("table", "name"))
        if name:
            name_counts[name] = name_counts.get(name, 0) + 1
    for name, count in name_counts.items():
        if count > 1:
            errors.append(f"Duplicate named-range/expression {name!r} ({count} occurrences)")

    # Content-validation references
    validation_names: set[str] = set()
    for cv in content.iter(q("table", "content-validation")):
        n = cv.attrib.get(q("table", "name"))
        if n:
            validation_names.add(n)
    for cell in content.iter(q("table", "table-cell")):
        ref = cell.attrib.get(q("table", "content-validation-name"))
        if ref and ref not in validation_names:
            errors.append(f"Dangling content-validation reference: {ref}")

    # Chart object package targets
    for obj in content.iter(q("draw", "object")):
        href = obj.attrib.get(q("xlink", "href"))
        if not href:
            continue
        target = href.lstrip("./").rstrip("/")
        if not any(n.startswith(target + "/") for n in names):
            errors.append(f"Missing draw:object package target: {href}")

    return {
        "status": "ok" if not errors else "errors_found",
        "errors": sorted(set(errors)),
        "warnings": sorted(set(warnings)),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("ods", type=Path)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="also validate content.xml and META-INF/manifest.xml against the OASIS ODF 1.3 RelaxNG schemas (requires lxml; install via `pip install open-document-lib[validate]`)",
    )
    args = parser.parse_args()
    result = validate(args.ods)
    if args.strict:
        # ods_common (imported above) has already put odf_lib on sys.path.
        from odf_lib.odf_common import apply_strict_schema_check

        apply_strict_schema_check(args.ods, result)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if result["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
