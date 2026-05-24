"""Shared helpers for small ODG scripts.

All format-agnostic functions live in odf_lib.odf_common.
This module adds the ODG namespace, MIMETYPE, and drawing-specific helpers.
"""

from __future__ import annotations

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
    copy_into_package as _copy_base,
    embed_pictures as _embed_pictures_base,
    ensure_manifest_entry as _ensure_base,
    find_soffice,
    inject_styles_from_file as _inject_styles_base,
    local_name,
    media_type_for,
    pack_dir_as_odf,
    pack_flat_odf,
    parse_xml_from_zip,
    replace_text_in_element,
    sniff_image_mime,
    unique_picture_name,
    unpack_flat_odf,
    update_meta_for_edit as _update_meta_base,
    write_odf_with_replacements as _write_base,
    xml_bytes,
)

# Direct re-exports.
__all__ = [
    "NS",
    "ODG_MIMETYPE",
    "GRAPHIC_KEYS",
    "SHAPE_TAGS",
    "STYLE_KEYS",
    "TEXT_KEYS",
    "q",
    "build_shape_style",
    "build_text_styles",
    "copy_into_package",
    "element_text",
    "embed_pictures",
    "ensure_manifest_entry",
    "ensure_shape_id",
    "find_shape_by_name",
    "find_soffice",
    "inject_styles_from_file",
    "iter_glue_points",
    "iter_pages",
    "iter_shapes",
    "local_name",
    "media_type_for",
    "pack_dir_as_odg",
    "pack_flat_odf",
    "page_name",
    "parse_xml_from_zip",
    "replace_text_in_element",
    "sniff_image_mime",
    "unique_picture_name",
    "unpack_flat_odf",
    "update_meta_for_edit",
    "write_odg_with_replacements",
    "xml_bytes",
]

NS = {
    "dc": "http://purl.org/dc/elements/1.1/",
    "draw": "urn:oasis:names:tc:opendocument:xmlns:drawing:1.0",
    "fo": "urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0",
    "manifest": "urn:oasis:names:tc:opendocument:xmlns:manifest:1.0",
    "meta": "urn:oasis:names:tc:opendocument:xmlns:meta:1.0",
    "office": "urn:oasis:names:tc:opendocument:xmlns:office:1.0",
    "style": "urn:oasis:names:tc:opendocument:xmlns:style:1.0",
    "svg": "urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
    "xlink": "http://www.w3.org/1999/xlink",
}

ODG_MIMETYPE = "application/vnd.oasis.opendocument.graphics"
SHAPE_TAGS = {
    "frame",
    "rect",
    "ellipse",
    "line",
    "connector",
    "path",
    "custom-shape",
}

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
    input_odg: Path,
    output_odg: Path,
    package_path: str,
    source: Path,
    replacements: dict[str, bytes],
) -> None:
    _copy_base(
        input_odg,
        output_odg,
        package_path,
        source,
        replacements,
        ODG_MIMETYPE,
    )


def pack_dir_as_odg(source_dir: Path, output_odg: Path) -> None:
    pack_dir_as_odf(source_dir, output_odg, ODG_MIMETYPE)


def write_odg_with_replacements(
    input_odg: Path,
    output_odg: Path,
    replacements: dict[str, bytes],
) -> None:
    _write_base(input_odg, output_odg, replacements, ODG_MIMETYPE)


def update_meta_for_edit(meta_root: ET.Element) -> None:
    _update_meta_base(meta_root, NS, q)


def inject_styles_from_file(input_odg: Path, styles_path: Path, output_odg: Path) -> list[str]:
    """Replace styles.xml with a curated branded drawing theme.

    Returns style names referenced by content.xml that are missing from the
    injected styles (dangling references).
    """
    return _inject_styles_base(input_odg, styles_path, output_odg, ODG_MIMETYPE)


def embed_pictures(input_odg: Path, pictures: dict[str, Path], output_odg: Path) -> None:
    """Add local pictures into the ODG package and register them in the manifest."""
    _embed_pictures_base(input_odg, pictures, output_odg, ODG_MIMETYPE, NS, q)


# Per-shape styling keys accepted in create_minimal_odg.py spec items.
GRAPHIC_KEYS = ("fill", "stroke", "stroke-width")
TEXT_KEYS = ("text-color", "font-size")
STYLE_KEYS = GRAPHIC_KEYS + TEXT_KEYS


def _unique_style_name(auto_styles: ET.Element, prefix: str) -> str:
    """Return ``{prefix}1``/``{prefix}2``/... not already used in *auto_styles*."""
    existing = {s.attrib.get(q("style", "name")) for s in auto_styles.findall(q("style", "style"))}
    n = 1
    while f"{prefix}{n}" in existing:
        n += 1
    return f"{prefix}{n}"


def build_shape_style(
    auto_styles: ET.Element,
    parent: str,
    overrides: dict[str, str],
) -> str:
    """Append a per-shape automatic *graphic* style to *auto_styles*; return its name.

    *overrides* may contain GRAPHIC_KEYS. ``fill``/``stroke`` accept a hex colour
    or the literal ``"none"``. The style is parented to *parent* (a role style
    such as ``gr-shape``) so unset properties fall through to the theme.

    Graphic-property overrides (fill/stroke) render correctly from an automatic
    style in content.xml; *text* overrides do not — use build_text_styles for
    those.
    """
    name = _unique_style_name(auto_styles, "gr-auto-")
    style = ET.SubElement(
        auto_styles,
        q("style", "style"),
        {q("style", "name"): name, q("style", "family"): "graphic", q("style", "parent-style-name"): parent},
    )
    graphic_props: dict[str, str] = {}
    fill = overrides.get("fill")
    if fill == "none":
        graphic_props[q("draw", "fill")] = "none"
    elif fill:
        graphic_props[q("draw", "fill")] = "solid"
        graphic_props[q("draw", "fill-color")] = fill
    stroke = overrides.get("stroke")
    if stroke == "none":
        graphic_props[q("draw", "stroke")] = "none"
    elif stroke:
        graphic_props[q("draw", "stroke")] = "solid"
        graphic_props[q("svg", "stroke-color")] = stroke
    if overrides.get("stroke-width"):
        graphic_props[q("svg", "stroke-width")] = overrides["stroke-width"]
    ET.SubElement(style, q("style", "graphic-properties"), graphic_props)
    return name


def build_text_styles(
    auto_styles: ET.Element,
    overrides: dict[str, str],
) -> tuple[str, str]:
    """Append a paragraph + text automatic style for shape-text overrides.

    Returns ``(paragraph_style_name, text_style_name)``. LibreOffice Draw only
    honours ``text-color``/``font-size`` for shape text when they are carried by
    paragraph/text automatic styles in content.xml applied to the ``text:p`` and
    a wrapping ``text:span`` — a graphic style's text-properties are ignored
    from an automatic style.
    """
    text_props: dict[str, str] = {}
    if overrides.get("text-color"):
        text_props[q("fo", "color")] = overrides["text-color"]
    if overrides.get("font-size"):
        text_props[q("fo", "font-size")] = overrides["font-size"]
    p_name = _unique_style_name(auto_styles, "P")
    p_style = ET.SubElement(
        auto_styles,
        q("style", "style"),
        {q("style", "name"): p_name, q("style", "family"): "paragraph"},
    )
    ET.SubElement(p_style, q("style", "text-properties"), dict(text_props))
    t_name = _unique_style_name(auto_styles, "T")
    t_style = ET.SubElement(
        auto_styles,
        q("style", "style"),
        {q("style", "name"): t_name, q("style", "family"): "text"},
    )
    ET.SubElement(t_style, q("style", "text-properties"), dict(text_props))
    return p_name, t_name


def element_text(element: ET.Element) -> str:
    """Extract all visible text from an ODG element and its descendants."""
    parts = []
    for node in element.iter():
        if node.text:
            parts.append(node.text)
        if node.tail:
            parts.append(node.tail)
    return " ".join("".join(parts).split())


def find_shape_by_name(parent: ET.Element, name: str) -> ET.Element | None:
    """Find a draw:* descendant with matching draw:name (recursive)."""
    name_attr = q("draw", "name")
    for descendant in parent.iter():
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


def iter_glue_points(shape: ET.Element):
    """Yield all draw:glue-point children of a shape."""
    yield from shape.findall(q("draw", "glue-point"))


def iter_pages(root: ET.Element):
    """Yield all draw:page elements from ODG content."""
    yield from root.findall(".//draw:page", NS)


def page_name(page: ET.Element) -> str:
    """Return the draw:name attribute of a page."""
    return page.attrib.get(q("draw", "name"), "")


def iter_shapes(page: ET.Element):
    """Yield all shape elements from a draw:page."""
    for node in page.iter():
        if local_name(node.tag) in SHAPE_TAGS:
            yield node
