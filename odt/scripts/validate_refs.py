#!/usr/bin/env python3
"""Validate core ODT package, media, manifest, and style references."""

from __future__ import annotations

import argparse
import json
import re
import zipfile
from pathlib import Path

from odt_common import NS, parse_xml_from_zip, q

PANDOC_PLACEHOLDER = re.compile(r"\[@([A-Za-z0-9_:\-]+)\]")

STYLE_ATTRS = [
    q("text", "style-name"),
    q("draw", "style-name"),
    q("draw", "text-style-name"),
    q("table", "style-name"),
    q("table", "default-cell-style-name"),
]


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
    styles = parse_xml_from_zip(path, "styles.xml") if "styles.xml" in names else None
    manifest = parse_xml_from_zip(path, "META-INF/manifest.xml") if "META-INF/manifest.xml" in names else None

    style_names = set()
    for root in [content, styles] if styles is not None else [content]:
        for style_el in root.findall(".//style:style", NS):
            name = style_el.attrib.get(q("style", "name"))
            if name:
                style_names.add(name)

    manifest_paths = set()
    if manifest is not None:
        manifest_paths = {
            e.attrib.get(q("manifest", "full-path")) for e in manifest.findall(".//manifest:file-entry", NS)
        }

    for node in content.iter():
        href = node.attrib.get(q("xlink", "href"))
        if href and not href.startswith("#") and "://" not in href:
            package_path = href.lstrip("./")
            # Sub-package object references (e.g. './Object 1' or './Object 1/')
            # resolve via the directory contents, not as a single file — they are
            # validated in the dedicated draw:object loop below.
            is_object_ref = node.tag == q("draw", "object")
            # ObjectReplacements/* are LibreOffice's optional preview-bitmap
            # cache; LibreOffice itself emits the reference even when the
            # bitmap is absent, so a missing one is at most a warning.
            is_replacement = package_path.startswith("ObjectReplacements/")
            if package_path.endswith("/") or is_object_ref:
                pass  # handled by the draw:object check
            elif is_replacement:
                if package_path not in names:
                    warnings.append(f"Missing object-replacement preview: {package_path}")
            else:
                if package_path not in names:
                    errors.append(f"Missing package media target: {href}")
                if manifest_paths and package_path not in manifest_paths:
                    warnings.append(f"Media target not listed in manifest: {package_path}")
        for attr in STYLE_ATTRS:
            style = node.attrib.get(attr)
            if style and style not in style_names:
                warnings.append(f"Unknown style reference {style}")

    # Citation checks: duplicate identifiers, leftover pandoc-style placeholders.
    citation_ids: dict[str, int] = {}
    for mark in content.iter(q("text", "bibliography-mark")):
        ident = mark.attrib.get(q("text", "identifier"))
        if ident:
            citation_ids[ident] = citation_ids.get(ident, 0) + 1
    for ident, count in citation_ids.items():
        if count > 1:
            warnings.append(f"Duplicate text:bibliography-mark identifier {ident!r} ({count} occurrences)")

    leftover_keys: set[str] = set()
    for paragraph in content.iter():
        if paragraph.tag not in {q("text", "p"), q("text", "h")}:
            continue
        para_text_parts: list[str] = []
        if paragraph.text:
            para_text_parts.append(paragraph.text)
        for descendant in paragraph.iter():
            if descendant is paragraph:
                continue
            if descendant.text:
                para_text_parts.append(descendant.text)
            if descendant.tail:
                para_text_parts.append(descendant.tail)
        for match in PANDOC_PLACEHOLDER.finditer("".join(para_text_parts)):
            leftover_keys.add(match.group(1))
    for key in sorted(leftover_keys):
        warnings.append(f"Unfilled citation placeholder [@{key}] (run fill_citations.py)")

    # Cross-reference checks: bookmark/reference-mark/sequence inventory and dangling refs.
    bookmark_names: dict[str, int] = {}
    bookmark_starts: dict[str, int] = {}
    bookmark_ends: dict[str, int] = {}
    refmark_names: dict[str, int] = {}
    refmark_starts: dict[str, int] = {}
    refmark_ends: dict[str, int] = {}
    sequence_names: dict[str, int] = {}

    for el in content.iter():
        tag = el.tag
        name = el.attrib.get(q("text", "name")) or el.attrib.get(q("text", "ref-name"))
        if tag == q("text", "bookmark"):
            if name:
                bookmark_names[name] = bookmark_names.get(name, 0) + 1
        elif tag == q("text", "bookmark-start"):
            if name:
                bookmark_starts[name] = bookmark_starts.get(name, 0) + 1
        elif tag == q("text", "bookmark-end"):
            if name:
                bookmark_ends[name] = bookmark_ends.get(name, 0) + 1
        elif tag == q("text", "reference-mark"):
            if name:
                refmark_names[name] = refmark_names.get(name, 0) + 1
        elif tag == q("text", "reference-mark-start"):
            if name:
                refmark_starts[name] = refmark_starts.get(name, 0) + 1
        elif tag == q("text", "reference-mark-end"):
            if name:
                refmark_ends[name] = refmark_ends.get(name, 0) + 1
        elif tag == q("text", "sequence"):
            seq_name = el.attrib.get(q("text", "ref-name"))
            if seq_name:
                sequence_names[seq_name] = sequence_names.get(seq_name, 0) + 1

    all_bookmark_names = set(bookmark_names) | set(bookmark_starts) | set(bookmark_ends)
    all_refmark_names = set(refmark_names) | set(refmark_starts) | set(refmark_ends)

    for name, count in bookmark_names.items():
        if count > 1:
            errors.append(f"Duplicate text:bookmark name {name!r} ({count} occurrences)")
    for name, count in refmark_names.items():
        if count > 1:
            errors.append(f"Duplicate text:reference-mark name {name!r} ({count} occurrences)")
    for name, count in sequence_names.items():
        if count > 1:
            errors.append(f"Duplicate text:sequence ref-name {name!r} ({count} occurrences)")
    # Range pair consistency
    for name in set(bookmark_starts) ^ set(bookmark_ends):
        errors.append(f"Unmatched text:bookmark range {name!r} (start without end or vice versa)")
    for name in set(refmark_starts) ^ set(refmark_ends):
        errors.append(f"Unmatched text:reference-mark range {name!r} (start without end or vice versa)")

    # Dangling references
    for ref in content.iter(q("text", "bookmark-ref")):
        rn = ref.attrib.get(q("text", "ref-name"))
        if rn and rn not in all_bookmark_names:
            errors.append(f"Dangling text:bookmark-ref to {rn!r}")
    for ref in content.iter(q("text", "reference-ref")):
        rn = ref.attrib.get(q("text", "ref-name"))
        if rn and rn not in all_refmark_names:
            errors.append(f"Dangling text:reference-ref to {rn!r}")
    for ref in content.iter(q("text", "sequence-ref")):
        rn = ref.attrib.get(q("text", "ref-name"))
        if rn and rn not in sequence_names:
            errors.append(f"Dangling text:sequence-ref to {rn!r}")

    # MathML/draw:object targets
    object_targets: set[str] = set()
    for obj in content.iter(q("draw", "object")):
        href = obj.attrib.get(q("xlink", "href"))
        if href:
            target = href.lstrip("./").rstrip("/")
            object_targets.add(target)
            # Confirm the target sub-path exists in the package
            if target + "/" not in {n if n.endswith("/") else n for n in names} and not any(
                n.startswith(target + "/") for n in names
            ):
                errors.append(f"Missing draw:object package target: {href}")

    # Note structure checks: duplicate ids, missing body, empty citation.
    note_ids: dict[str, int] = {}
    for note in content.iter(q("text", "note")):
        note_id = note.attrib.get(q("text", "id"))
        if note_id:
            note_ids[note_id] = note_ids.get(note_id, 0) + 1
        body = note.find("text:note-body", NS)
        if body is None:
            errors.append(f"text:note missing text:note-body (id={note_id or '?'})")
        citation = note.find("text:note-citation", NS)
        if citation is None or not (citation.text or "").strip():
            warnings.append(f"text:note has empty text:note-citation (id={note_id or '?'})")
    for note_id, count in note_ids.items():
        if count > 1:
            errors.append(f"Duplicate text:note id {note_id!r} ({count} occurrences)")

    return {"status": "ok" if not errors else "errors_found", "errors": errors, "warnings": sorted(set(warnings))}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("odt", type=Path)
    parser.add_argument(
        "--strict",
        action="store_true",
        help="also validate content.xml and META-INF/manifest.xml against the OASIS ODF 1.3 RelaxNG schemas (requires lxml; install via `pip install open-document-lib[validate]`)",
    )
    args = parser.parse_args()
    result = validate(args.odt)
    if args.strict:
        # odt_common (imported above) has already put odf_lib on sys.path.
        from odf_lib.odf_common import apply_strict_schema_check

        apply_strict_schema_check(args.odt, result)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    if result["errors"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
