"""Shared helpers for small ODS scripts.

All format-agnostic functions live in odf_lib.odf_common.
This module adds the ODS namespace, MIMETYPE, and spreadsheet-specific helpers.
"""

from __future__ import annotations

import csv
import re
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
    copy_with_multiple_members as _copy_members_base,
    ensure_manifest_entry as _ensure_base,
    find_soffice,
    pack_dir_as_odf,
    pack_flat_odf,
    parse_xml_from_zip,
    unique_object_name,
    unpack_flat_odf,
    update_meta_for_edit as _update_meta_base,
    write_odf_with_replacements as _write_base,
    xml_bytes,
)

# Direct re-exports.
__all__ = [
    "NS",
    "ODS_MIMETYPE",
    "q",
    "a1",
    "build_chart_content",
    "cell_text",
    "cell_value",
    "col_to_index",
    "copy_with_multiple_members",
    "ensure_cell",
    "ensure_manifest_entry",
    "expanded_rows",
    "find_sheet",
    "find_soffice",
    "index_to_col",
    "iter_sheets",
    "pack_dir_as_ods",
    "pack_flat_odf",
    "parse_a1",
    "parse_xml_from_zip",
    "repeated",
    "set_cell_value",
    "sheet_name",
    "unique_object_name",
    "unpack_flat_odf",
    "update_meta_for_edit",
    "write_csv",
    "write_ods_with_replacements",
    "xml_bytes",
]

NS = {
    "chart": "urn:oasis:names:tc:opendocument:xmlns:chart:1.0",
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

ODS_MIMETYPE = "application/vnd.oasis.opendocument.spreadsheet"

for prefix, uri in NS.items():
    ET.register_namespace(prefix, uri)


def q(prefix: str, local: str) -> str:
    return f"{{{NS[prefix]}}}{local}"


def pack_dir_as_ods(source_dir: Path, output_ods: Path) -> None:
    pack_dir_as_odf(source_dir, output_ods, ODS_MIMETYPE)


def write_ods_with_replacements(
    input_ods: Path,
    output_ods: Path,
    replacements: dict[str, bytes],
) -> None:
    _write_base(input_ods, output_ods, replacements, ODS_MIMETYPE)


def update_meta_for_edit(meta_root: ET.Element) -> None:
    _update_meta_base(meta_root, NS, q)


def ensure_manifest_entry(manifest_root: ET.Element, full_path: str, media_type: str) -> None:
    _ensure_base(manifest_root, full_path, media_type, NS, q)


def copy_with_multiple_members(
    input_ods: Path,
    output_ods: Path,
    new_members: dict[str, bytes],
    replacements: dict[str, bytes],
) -> None:
    _copy_members_base(input_ods, output_ods, new_members, replacements, ODS_MIMETYPE)


CHART_TYPE_TO_CLASS: dict[str, str] = {
    "bar": "chart:bar",
    "line": "chart:line",
    "pie": "chart:circle",
    "scatter": "chart:scatter",
}


def build_chart_content(
    chart_type: str,
    data_range: str,
    title: str | None = None,
    x_label: str | None = None,
    y_label: str | None = None,
) -> bytes:
    """Build the Object N/content.xml payload for an embedded ODS chart.

    Returns UTF-8 bytes ready to be added as ``Object N/content.xml`` of a
    ``application/vnd.oasis.opendocument.chart`` sub-package.

    Args:
        chart_type: One of ``bar``, ``line``, ``pie``, ``scatter``.
        data_range: ODF cell range, e.g. ``$Sheet1.$A$1:.$B$10``.
        title: Optional chart title.
        x_label: Optional x-axis label.
        y_label: Optional y-axis label.
    """
    if chart_type not in CHART_TYPE_TO_CLASS:
        raise SystemExit(f"unknown chart type {chart_type!r}; choose from {sorted(CHART_TYPE_TO_CLASS)}")
    chart_class = CHART_TYPE_TO_CLASS[chart_type]

    office_ns = NS["office"]
    chart_ns = NS["chart"]
    table_ns = NS["table"]
    text_ns = NS["text"]
    svg_ns = NS["svg"]
    style_ns = NS["style"]
    draw_ns = NS["draw"]

    root = ET.Element(
        f"{{{office_ns}}}document-content",
        {f"{{{office_ns}}}version": "1.3"},
    )
    auto_styles = ET.SubElement(root, f"{{{office_ns}}}automatic-styles")
    # Minimal chart style
    style = ET.SubElement(
        auto_styles,
        f"{{{style_ns}}}style",
        {f"{{{style_ns}}}name": "ch1", f"{{{style_ns}}}family": "chart"},
    )
    ET.SubElement(
        style,
        f"{{{style_ns}}}graphic-properties",
        {f"{{{draw_ns}}}stroke": "none", f"{{{draw_ns}}}fill": "none"},
    )

    body = ET.SubElement(root, f"{{{office_ns}}}body")
    chart_root = ET.SubElement(body, f"{{{office_ns}}}chart")
    chart = ET.SubElement(
        chart_root,
        f"{{{chart_ns}}}chart",
        {
            f"{{{chart_ns}}}class": chart_class,
            f"{{{svg_ns}}}width": "10cm",
            f"{{{svg_ns}}}height": "7cm",
            f"{{{chart_ns}}}style-name": "ch1",
        },
    )
    if title:
        title_el = ET.SubElement(chart, f"{{{chart_ns}}}title")
        p = ET.SubElement(title_el, f"{{{text_ns}}}p")
        p.text = title

    plot_area = ET.SubElement(
        chart,
        f"{{{chart_ns}}}plot-area",
        {f"{{{table_ns}}}cell-range-address": data_range},
    )

    # Axes (skip for pie)
    if chart_type != "pie":
        x_axis = ET.SubElement(
            plot_area, f"{{{chart_ns}}}axis", {f"{{{chart_ns}}}dimension": "x", f"{{{chart_ns}}}name": "primary-x"}
        )
        if x_label:
            t = ET.SubElement(x_axis, f"{{{chart_ns}}}title")
            p = ET.SubElement(t, f"{{{text_ns}}}p")
            p.text = x_label
        y_axis = ET.SubElement(
            plot_area, f"{{{chart_ns}}}axis", {f"{{{chart_ns}}}dimension": "y", f"{{{chart_ns}}}name": "primary-y"}
        )
        if y_label:
            t = ET.SubElement(y_axis, f"{{{chart_ns}}}title")
            p = ET.SubElement(t, f"{{{text_ns}}}p")
            p.text = y_label

    # Series — one bound to the whole data range. LibreOffice will read columns.
    ET.SubElement(
        plot_area,
        f"{{{chart_ns}}}series",
        {f"{{{chart_ns}}}values-cell-range-address": data_range},
    )

    return xml_bytes(root)


def col_to_index(col: str) -> int:
    """Convert a column letter (A, B, …, AA) to a 1-based index."""
    value = 0
    for char in col.upper():
        if not ("A" <= char <= "Z"):
            raise ValueError(f"Invalid column: {col}")
        value = value * 26 + ord(char) - ord("A") + 1
    return value


def index_to_col(index: int) -> str:
    """Convert a 1-based column index to a letter (1 → A, 27 → AA)."""
    chars = []
    while index:
        index, rem = divmod(index - 1, 26)
        chars.append(chr(ord("A") + rem))
    return "".join(reversed(chars))


def parse_a1(address: str) -> tuple[str, int, int]:
    """Parse an A1 address like 'Sheet!$B$3' into (sheet, row, col)."""
    if "!" in address:
        sheet, cell = address.split("!", 1)
    else:
        sheet, cell = "", address
    match = re.fullmatch(r"\$?([A-Za-z]+)\$?([0-9]+)", cell)
    if not match:
        raise SystemExit(f"Invalid A1 address: {address}")
    return sheet, int(match.group(2)), col_to_index(match.group(1))


def a1(row: int, col: int) -> str:
    """Build an A1 cell reference from 1-based row and column indices."""
    return f"{index_to_col(col)}{row}"


def cell_text(cell: ET.Element) -> str:
    """Extract visible text from a table:table-cell element."""
    return " ".join("".join(node.text or "" for node in cell.findall(".//text:p", NS)).split())


def cell_value(cell: ET.Element) -> object:
    """Return the typed value of a cell based on office:value-type."""
    value_type = cell.attrib.get(q("office", "value-type"))
    if value_type in {"float", "percentage", "currency"}:
        raw = cell.attrib.get(q("office", "value"))
        try:
            return float(raw) if raw is not None else None
        except ValueError:
            return raw
    if value_type == "boolean":
        return cell.attrib.get(q("office", "boolean-value")) == "true"
    if value_type == "date":
        return cell.attrib.get(q("office", "date-value"))
    if value_type == "time":
        return cell.attrib.get(q("office", "time-value"))
    return cell_text(cell)


def repeated(node: ET.Element, attr: str) -> int:
    """Return the repeat count for table:number-columns-repeated or similar."""
    raw = node.attrib.get(q("table", attr))
    if raw is None:
        return 1
    try:
        return max(1, int(raw))
    except ValueError:
        return 1


def iter_sheets(root: ET.Element):
    """Yield all table:table elements (sheets) from ODS content."""
    yield from root.findall(".//table:table", NS)


def sheet_name(sheet: ET.Element) -> str:
    """Return the table:name attribute of a sheet."""
    return sheet.attrib.get(q("table", "name"), "")


def expanded_rows(
    sheet: ET.Element,
    max_repeat: int = 1000,
) -> list[list[ET.Element]]:
    """Expand repeated rows and columns into a flat list of row cell lists."""
    rows: list[list[ET.Element]] = []
    for row in sheet.findall("table:table-row", NS):
        row_cells: list[ET.Element] = []
        for cell in list(row):
            if cell.tag not in {
                q("table", "table-cell"),
                q("table", "covered-table-cell"),
            }:
                continue
            count = min(repeated(cell, "number-columns-repeated"), max_repeat)
            row_cells.extend([cell] * count)
        for _ in range(min(repeated(row, "number-rows-repeated"), max_repeat)):
            rows.append(row_cells)
    return rows


def set_cell_value(
    cell: ET.Element,
    value: str,
    formula: bool = False,
) -> None:
    """Set the value or formula of a table:table-cell element."""
    cell.attrib.pop(q("table", "number-columns-repeated"), None)
    for child in list(cell):
        cell.remove(child)
    if formula:
        cell.set(q("table", "formula"), value)
        cell.set(q("office", "value-type"), "float")
    else:
        try:
            number = float(value)
        except ValueError:
            cell.set(q("office", "value-type"), "string")
        else:
            cell.set(q("office", "value-type"), "float")
            cell.set(q("office", "value"), str(number))
    p = ET.SubElement(cell, q("text", "p"))
    p.text = "" if formula else value


def ensure_cell(
    sheet: ET.Element,
    row_index: int,
    col_index: int,
) -> ET.Element:
    """Ensure a cell exists at the given row/col, creating intermediates."""
    rows = sheet.findall("table:table-row", NS)
    while len(rows) < row_index:
        ET.SubElement(sheet, q("table", "table-row"))
        rows = sheet.findall("table:table-row", NS)
    row = rows[row_index - 1]
    cells = [c for c in list(row) if c.tag == q("table", "table-cell")]
    while len(cells) < col_index:
        ET.SubElement(row, q("table", "table-cell"))
        cells = [c for c in list(row) if c.tag == q("table", "table-cell")]
    return cells[col_index - 1]


def find_sheet(root: ET.Element, name: str) -> ET.Element:
    """Find a sheet by name. If name is empty, returns the first sheet."""
    sheets = list(iter_sheets(root))
    if not name and sheets:
        return sheets[0]
    for sheet in sheets:
        if sheet_name(sheet) == name:
            return sheet
    raise SystemExit(f"Sheet not found: {name}")


def write_csv(path: Path, rows: list[list[object]]) -> None:
    """Write rows to a CSV file with UTF-8 encoding."""
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerows(rows)
