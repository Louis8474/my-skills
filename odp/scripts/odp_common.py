"""Shared helpers for small ODP scripts.

All format-agnostic functions live in odf_lib.odf_common.
This module adds the ODP namespace, MIMETYPE, and thin wrappers.
"""

from __future__ import annotations

import copy
import sys
from pathlib import Path
from xml.etree import ElementTree as ET

# Locate the bundled odf_lib/ package — at the repo root in a dev
# checkout, or inside the skill directory when installed standalone.
for _parent in Path(__file__).resolve().parents:
    if (_parent / "odf_lib" / "odf_common.py").is_file():
        if str(_parent) not in sys.path:
            sys.path.insert(0, str(_parent))
        break
else:
    raise ImportError(
        "odf_lib not found near this script — reinstall the skill so its bundled odf_lib/ directory is present"
    )

# Single consolidated import block from odf_lib.odf_common.
from odf_lib.odf_common import (  # noqa: E402, I001
    clear_children,
    copy_into_package as _copy_base,
    embed_pictures as _embed_pictures_base,
    ensure_manifest_entry as _ensure_base,
    find_soffice,
    inject_styles_from_file as _inject_styles_base,
    media_type_for,
    pack_dir_as_odf,
    pack_flat_odf,
    parse_xml_from_zip,
    replace_text_in_element,
    sniff_image_mime,
    unique_picture_name,
    unpack_flat_odf,
    unpack_to_temp,
    update_meta_for_edit as _update_meta_base,
    write_odf_with_replacements as _write_base,
    xml_bytes,
)

# Direct re-exports.
__all__ = [
    "NS",
    "ODP_MIMETYPE",
    "q",
    "clear_children",
    "copy_into_package",
    "copy_slide",
    "embed_pictures",
    "ensure_manifest_entry",
    "ensure_shape_id",
    "ensure_timing_root",
    "find_shape_by_name",
    "find_soffice",
    "find_slides",
    "inject_styles_from_file",
    "media_type_for",
    "pack_dir_as_odp",
    "pack_flat_odf",
    "parse_xml_from_zip",
    "replace_text_in_element",
    "select_slide",
    "sniff_image_mime",
    "unique_picture_name",
    "unpack_flat_odf",
    "unpack_to_temp",
    "update_meta_for_edit",
    "write_odp_with_replacements",
    "xml_bytes",
]

NS = {
    "anim": "urn:oasis:names:tc:opendocument:xmlns:animation:1.0",
    "config": "urn:oasis:names:tc:opendocument:xmlns:config:1.0",
    "dc": "http://purl.org/dc/elements/1.1/",
    "draw": "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
    "fo": "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
    "manifest": "urn:oasis:names:tc:opendocument:xmlns:manifest:1.0",
    "meta": "urn:oasis:names:tc:opendocument:xmlns:meta:1.0",
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "presentation": "urn:oasis:names:tc:opendocument:xmlns:presentation:1.0",
    "smil": "urn:oasis:names:tc:opendocument:xmlns:smil-compatible:1.0",
    "style": "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
    "svg": "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
    "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
    "xlink": "http://www.w3.org/1999/xlink",
}

ODP_MIMETYPE = "application/vnd.oasis.opendocument.presentation"

for prefix, uri in NS.items():
    ET.register_namespace(prefix, uri)


def q(prefix: str, local: str) -> str:
    return f"{{{NS[prefix]}}}{local}"


def ensure_manifest_entry(
    manifest_root: ET.Element,
    full_path: str,
    media_type: str,
) -> None:
    _ensure_base(manifest_root, full_path, media_type, NS, q)


def copy_into_package(
    input_odp: Path,
    output_odp: Path,
    package_path: str,
    source: Path,
    replacements: dict[str, bytes],
) -> None:
    _copy_base(
        input_odp,
        output_odp,
        package_path,
        source,
        replacements,
        ODP_MIMETYPE,
    )


def pack_dir_as_odp(source_dir: Path, output_odp: Path) -> None:
    pack_dir_as_odf(source_dir, output_odp, ODP_MIMETYPE)


def write_odp_with_replacements(
    input_odp: Path,
    output_odp: Path,
    replacements: dict[str, bytes],
) -> None:
    _write_base(input_odp, output_odp, replacements, ODP_MIMETYPE)


def update_meta_for_edit(meta_root: ET.Element) -> None:
    _update_meta_base(meta_root, NS, q)


def inject_styles_from_file(input_odp: Path, styles_path: Path, output_odp: Path) -> list[str]:
    """Replace styles.xml with a curated branded presentation theme.

    Returns style names referenced by content.xml that are missing from the
    injected styles (dangling references).
    """
    return _inject_styles_base(input_odp, styles_path, output_odp, ODP_MIMETYPE)


def embed_pictures(input_odp: Path, pictures: dict[str, Path], output_odp: Path) -> None:
    """Add local pictures into the ODP package and register them in the manifest."""
    _embed_pictures_base(input_odp, pictures, output_odp, ODP_MIMETYPE, NS, q)


def find_slides(content_root: ET.Element) -> list[ET.Element]:
    """Return all draw:page elements from ODP content."""
    return content_root.findall(".//draw:page", NS)


def select_slide(content_root: ET.Element, slide: str | None) -> ET.Element:
    """Select a slide by index (1-based string) or name."""
    slides = find_slides(content_root)
    if not slides:
        raise SystemExit("No draw:page slides found")
    if slide is None:
        return slides[0]
    if slide.isdigit():
        index = int(slide)
        if index < 1 or index > len(slides):
            raise SystemExit(f"Slide index out of range: {index}")
        return slides[index - 1]
    for page in slides:
        if page.attrib.get(q("draw", "name")) == slide:
            return page
    raise SystemExit(f"Slide not found: {slide}")


def find_shape_by_name(slide_page: ET.Element, name: str) -> ET.Element | None:
    """Find a draw:frame / draw:shape / draw:* with matching draw:name (recursive)."""
    name_attr = q("draw", "name")
    for descendant in slide_page.iter():
        if descendant.attrib.get(name_attr) == name:
            return descendant
    return None


def ensure_shape_id(shape: ET.Element, content_root: ET.Element) -> str:
    """Return shape's draw:id, or assign a unique 'shape-N' and return that."""
    id_attr = q("draw", "id")
    existing = shape.attrib.get(id_attr)
    if existing:
        return existing
    all_ids: set[str] = set()
    for el in content_root.iter():
        v = el.attrib.get(id_attr)
        if v:
            all_ids.add(v)
    counter = 1
    while f"shape-{counter}" in all_ids:
        counter += 1
    new_id = f"shape-{counter}"
    shape.set(id_attr, new_id)
    return new_id


def ensure_timing_root(slide_page: ET.Element) -> ET.Element:
    """Locate or create the slide's animation timing root.

    Per ODF 1.3, animations live under a ``<anim:par presentation:node-type="timing-root">``
    that is a direct child of ``<draw:page>``. This helper returns it, creating it
    as the last child if missing.
    """
    anim_par_tag = q("anim", "par")
    node_type_attr = q("presentation", "node-type")
    for child in slide_page:
        if child.tag == anim_par_tag and child.attrib.get(node_type_attr) == "timing-root":
            return child
    timing_root = ET.SubElement(
        slide_page,
        anim_par_tag,
        {node_type_attr: "timing-root"},
    )
    return timing_root


def copy_slide(page: ET.Element) -> ET.Element:
    """Deep-copy a draw:page element."""
    return copy.deepcopy(page)
