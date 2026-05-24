"""Shared helpers for small ODT scripts.

All format-agnostic functions live in odf_lib.odf_common.
This module adds the ODT namespace, MIMETYPE, and thin wrappers
so that existing script imports (``from odt_common import …``)
continue to work unchanged.
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
    clear_children,
    copy_into_package as _copy_base,
    copy_with_multiple_members as _copy_members_base,
    ensure_manifest_entry as _ensure_base,
    ensure_sequence_declarations as _ensure_seq_base,
    embed_pictures as _embed_pictures_base,
    find_pandoc,
    inject_styles_from_file as _inject_styles_base,
    find_text_position_in_element,
    insert_after_text_in_element,
    insert_in_paragraph,
    latex_to_mathml,
    media_type_for,
    pack_dir_as_odf,
    pack_flat_odf,
    parse_xml_from_zip,
    replace_pattern_with_element_in_element,
    replace_text_in_element,
    sniff_image_mime,
    unique_object_name,
    unique_picture_name,
    unpack_flat_odf,
    update_meta_for_edit as _update_meta_base,
    wrap_text_across_elements,
    wrap_text_with_pair_in_element,
    write_odf_with_replacements as _write_base,
    xml_bytes,
)

# Direct re-exports.
__all__ = [
    "NS",
    "ODT_MIMETYPE",
    "q",
    "clear_children",
    "copy_into_package",
    "copy_with_multiple_members",
    "ensure_manifest_entry",
    "embed_pictures",
    "ensure_sequence_declarations",
    "find_pandoc",
    "inject_styles_from_file",
    "find_text_position_in_element",
    "insert_after_text_in_element",
    "insert_in_paragraph",
    "latex_to_mathml",
    "media_type_for",
    "pack_dir_as_odt",
    "pack_flat_odf",
    "parse_xml_from_zip",
    "replace_pattern_with_element_in_element",
    "replace_text_in_element",
    "sniff_image_mime",
    "unique_object_name",
    "unique_picture_name",
    "unpack_flat_odf",
    "update_meta_for_edit",
    "wrap_text_across_elements",
    "wrap_text_with_pair_in_element",
    "write_odt_with_replacements",
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
    "table": "urn:oasis:names:tc:opendocument:xmlns:table:1.0",
    "text": "urn:oasis:names:tc:opendocument:xmlns:text:1.0",
    "xlink": "http://www.w3.org/1999/xlink",
}

ODT_MIMETYPE = "application/vnd.oasis.opendocument.text"

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
    input_odt: Path,
    output_odt: Path,
    package_path: str,
    source: Path,
    replacements: dict[str, bytes],
) -> None:
    _copy_base(
        input_odt,
        output_odt,
        package_path,
        source,
        replacements,
        ODT_MIMETYPE,
    )


def pack_dir_as_odt(source_dir: Path, output_odt: Path) -> None:
    pack_dir_as_odf(source_dir, output_odt, ODT_MIMETYPE)


def write_odt_with_replacements(
    input_odt: Path,
    output_odt: Path,
    replacements: dict[str, bytes],
) -> None:
    _write_base(input_odt, output_odt, replacements, ODT_MIMETYPE)


def update_meta_for_edit(meta_root: ET.Element) -> None:
    _update_meta_base(meta_root, NS, q)


def copy_with_multiple_members(
    input_odt: Path,
    output_odt: Path,
    new_members: dict[str, bytes],
    replacements: dict[str, bytes],
) -> None:
    _copy_members_base(input_odt, output_odt, new_members, replacements, ODT_MIMETYPE)


def ensure_sequence_declarations(text_root: ET.Element, names: list[str]) -> None:
    _ensure_seq_base(text_root, names, NS)


def inject_styles_from_file(input_odt: Path, styles_path: Path, output_odt: Path) -> list[str]:
    return _inject_styles_base(input_odt, styles_path, output_odt, ODT_MIMETYPE)


def embed_pictures(input_odt: Path, pictures: dict[str, Path], output_odt: Path) -> None:
    _embed_pictures_base(input_odt, pictures, output_odt, ODT_MIMETYPE, NS, q)
