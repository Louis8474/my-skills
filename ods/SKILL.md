---
name: ods
description: "Create, read, edit, convert, repair, inspect, analyze, or format OpenDocument Spreadsheet files (.ods). Supports named ranges, data validation (dropdowns and range constraints), and embedded charts (bar, line, pie, scatter)."
triggers: [".ods", "ODS", "OpenDocument Spreadsheet", "Open Office spreadsheet", "LibreOffice Calc", "Calc sheet", "ods-Datei", "OpenDocument-Tabelle", "Tabellenkalkulation", "named range", "named expression", "data validation", "dropdown", "Auswahlliste", "chart", "Diagramm", "Balkendiagramm", "Liniendiagramm", "Kreisdiagramm", "Punktdiagramm", "bar chart", "line chart", "pie chart", "scatter", "flat ODF", ".fods"]
dont_use_for: ["text documents (.odt)", "presentations (.odp)", "analysis where deliverable is not a spreadsheet"]
license: MIT
version: "1.2.0"
---

# ODS creation, editing, and analysis

## Overview

An `.ods` file is an OpenDocument ZIP package for spreadsheets. Important package files:

- `mimetype` - should be the first ZIP entry and stored uncompressed as `application/vnd.oasis.opendocument.spreadsheet`
- `content.xml` - sheets, rows, cells, formulas, charts, and most content
- `styles.xml` - cell, table, page, and number styles
- `meta.xml` - document metadata
- `settings.xml` - application settings
- `META-INF/manifest.xml` - package manifest

## Quick Reference

| Task | Preferred approach |
|------|--------------------|
| Read sheets/data | Use `scripts/extract_sheets.py` or parse `content.xml` |
| Create simple workbook | Generate ODS package XML directly |
| Create styled/model workbook | Start from an `.ods` template and edit cells XML-safely |
| Extract/check formulas | Use `scripts/extract_formulas.py` |
| Convert CSV/XLSX to ODS | Use LibreOffice only when the source already exists or interoperability requires it |
| Validate formulas/recalc | Recalculate with LibreOffice, then inspect formulas, CSV/PDF, and error values |

## Tool Checks

Before starting a real ODS task, check available tools:

```bash
python3 -c "import pandas, odf; print('pandas and odfpy available')"
```

Resolve the LibreOffice command as described in [docs/soffice-resolver.md](../../docs/soffice-resolver.md).

Use the bundled workspace Python when normal `python3` lacks pandas or other spreadsheet libraries.

## Reading Data

When `pandas` and `odfpy` are available:

```python
import pandas as pd

sheets = pd.read_excel("input.ods", sheet_name=None, engine="odf")
for name, df in sheets.items():
    print(name, df.shape)
```

When the ODF engine is unavailable, prefer LibreOffice conversion:

```bash
# Resolve SOFFICE as shown in Tool Checks.
"$SOFFICE" --headless --convert-to xlsx input.ods --outdir converted
```

Then inspect the resulting XLSX with normal spreadsheet tooling.

For raw package inspection:

```bash
python -m zipfile -e input.ods unpacked_ods
```

Cells live in `content.xml` under `table:table`, `table:table-row`, and `table:table-cell`.

Bundled scripts for common inspection tasks:

```bash
python scripts/extract_sheets.py input.ods
python scripts/extract_sheets.py input.ods --json
python scripts/extract_formulas.py input.ods
python scripts/inspect_package.py input.ods
```

For the full script reference, see [docs/script-reference.md](../../docs/script-reference.md#ods).

## content.xml Structure

An ODS workbook normally stores sheets in `content.xml` under:

```text
office:document-content
  office:body
    office:spreadsheet
      table:table
        table:table-row
          table:table-cell
            text:p
```

Important spreadsheet elements and attributes:

- `table:table` - one sheet; `table:name` is the sheet name
- `table:table-row` - row; may use `table:number-rows-repeated`
- `table:table-cell` - cell; may use `table:number-columns-repeated`
- `office:value-type` - `string`, `float`, `percentage`, `currency`, `date`, `time`, `boolean`
- `office:value`, `office:date-value`, `office:time-value`, `office:boolean-value` - typed stored values
- `table:formula` - formula, commonly with an `of:=` prefix
- `text:p` - displayed text inside the cell
- `table:covered-table-cell` - merged-cell covered area
- `table:named-expressions`, `table:named-range` - named ranges when present

ODS often compresses empty or repeated cells/rows. Always expand `table:number-columns-repeated` and `table:number-rows-repeated` when mapping to A1 addresses, and preserve or intentionally rewrite them when saving.

## Creating ODS Files

ODS is an XML package and can be generated directly. Do not default to XLSX as an intermediate when the deliverable is natively ODS.

Choose the creation path by risk:

| Scenario | Use |
|----------|-----|
| Simple data workbook | Direct ODS XML generation |
| Styled report/model with formulas, charts, protected areas, or print settings | Template-first ODS |
| Existing CSV/XLSX source or explicit cross-format conversion | LibreOffice conversion fallback |

### Direct ODS XML Generation

Use this for straightforward sheet exports, data tables, and simple formulas:

```bash
python scripts/create_minimal_ods.py workbook.json output.ods
```

Keep the first generated version small: sheets, rows, typed cells, formulas, simple styles. Add charts, named ranges, print areas, and protection only when needed.

### Template-First ODS

Use this for styled reports, financial models, or workbooks with formulas/formatting that users expect to keep.

1. Extract the template.
2. Inspect sheets, styles, formulas, named ranges, and repeated cells.
3. Edit targeted cells by sheet and A1 address.
4. Preserve formulas as formulas.
5. Repack and run recalc/data QA.

### Conversion Fallback

Use pandas/LibreOffice conversion when the source already exists in another tabular format:

```python
import pandas as pd

with pd.ExcelWriter("output.ods", engine="odf") as writer:
    df.to_excel(writer, sheet_name="Data", index=False)
```

For XLSX/CSV interoperability:

```bash
# Resolve SOFFICE as shown in Tool Checks.
"$SOFFICE" --headless --convert-to ods workbook.xlsx --outdir out
```

Treat conversion as lossy until QA proves otherwise. Verify formulas, date/number formats, charts, sheet names, and repeated/merged cells.

## Bundled Scripts

For creation and editing scripts, see [docs/script-reference.md](../../docs/script-reference.md#ods).
All scripts use the Python standard library and are invoked as:

```bash
python scripts/<script_name>.py [args]
```

## Editing Existing ODS Files

For data-only updates, load sheets into DataFrames, modify, and write a new ODS. Warn the user if this will not preserve complex formatting, formulas, charts, or macros.

For template-preserving edits:

1. Extract the package.
2. Parse `content.xml` and `styles.xml` with an XML parser.
3. Preserve table names, repeated row/cell attributes, style names, and formula attributes.
4. Update `META-INF/manifest.xml` when adding or removing embedded objects.
5. Repack with `mimetype` first and uncompressed.

Repack pattern:

```bash
cd unpacked_ods
zip -0 -X ../output.ods mimetype
zip -r -X ../output.ods . -x mimetype
```

## Named Ranges, Data Validation, and Charts

For workbook semantics beyond plain cells, v0.6+ provides direct ODF-native helpers:

```bash
# Named range (cell-range alias usable in formulas):
python scripts/add_named_range.py wb.ods --name Sales \
    --range 'Sheet1.B2:B100' -o wb-nr.ods

# Named expression (formula or constant alias):
python scripts/add_named_range.py wb.ods --name TaxRate \
    --expression '0.19' -o wb-nr.ods

# Dropdown list:
python scripts/add_data_validation.py wb.ods --name months --type list \
    --values 'Jan,Feb,Mar,Apr' --apply 'Sheet1.A2:A100' -o wb-val.ods

# Numeric constraint:
python scripts/add_data_validation.py wb.ods --name positive --type number \
    --condition 'value() > 0' --apply 'Sheet1.B2:B100' -o wb-val.ods

# Bar chart embedded into a cell:
python scripts/add_chart.py wb.ods --type bar \
    --data 'Sheet1.A1:B10' --title 'Q1 Sales' \
    --cell 'Sheet1.D1' -o wb-chart.ods

# Inspect:
python scripts/list_named_ranges.py wb.ods --json
python scripts/list_charts.py wb.ods --json
```

Chart types: `bar`, `line`, `pie`, `scatter`. Charts are embedded as LibreOffice-native `Object N/` sub-packages with the `application/vnd.oasis.opendocument.chart` MIME type. LibreOffice renders them when the file is opened or converted to PDF.

The validator (`validate_refs.py`) catches dangling named-range sheet targets, dangling content-validation references, and missing chart object package targets.

## Formula and Data Rules

- Preserve formulas as formulas. Do not replace formulas with hardcoded calculated values unless the user explicitly asks.
- ODS formulas commonly appear in attributes such as `table:formula`, often with an `of:=` prefix.
- Keep value metadata aligned with displayed text: `office:value-type`, `office:value`, `office:date-value`, `office:time-value`, and percentage/currency attributes matter.
- Watch for compressed repeated cells/rows via `table:number-columns-repeated` and `table:number-rows-repeated`.
- After conversion from XLSX, verify formula compatibility because not every Excel formula maps cleanly to OpenFormula/LibreOffice Calc.

## ODS Modeling Checklist

- Set explicit cell types; do not store all values as strings.
- Preserve formulas as formulas and keep displayed text/value metadata aligned.
- Expand repeated cells/rows before positional edits.
- Keep headers, assumptions, calculations, and outputs clearly separated for model workbooks.
- Use consistent number formats for currency, percentages, dates, and zeros.
- Treat blank cells, nulls, zero values, and error values deliberately.
- Verify merged cells and covered cells after XML edits.
- For formula-heavy workbooks, recalc with LibreOffice before delivery.
- For data exports, compare row/column counts against the source.

## QA (Required)

For created or edited ODS files, run a data-first QA loop.

### Content QA

```bash
python scripts/extract_sheets.py output.ods --json > qa/sheets.json
python scripts/extract_formulas.py output.ods > qa/formulas.json
```

Check sheet names, dimensions, row/column counts, typed values, formulas, dates, percentages, currency cells, and obvious error strings.

### Package QA

```bash
python scripts/inspect_package.py output.ods > qa/package.json
python scripts/validate_refs.py output.ods
```

Check that `mimetype` is first, required XML files exist, media/chart targets exist, manifest entries are present, and style references are not broken.

### Recalc and Export QA

Recalculate with LibreOffice when formulas are present:

```bash
python scripts/recalc.py output.ods --outdir qa
```

Export important sheets to CSV for data comparison:

```bash
python scripts/export_csv.py output.ods --sheet Data --output qa/data.csv
```

For user-facing reports, also render/export via LibreOffice to PDF and inspect layout, charts, table widths, page breaks, headers, and footers.

### Verification Loop

1. Extract sheet data and formulas.
2. Validate package references.
3. Recalculate if formulas exist.
4. Export CSV/PDF for the relevant sheets.
5. Fix data, formula, type, formatting, or package issues.
6. Re-run the relevant checks until no unresolved issues remain.

## See also

Part of the [open-document-skills](https://github.com/leiverkus/open-document-skills) suite:

- [`odt`](../odt/SKILL.md) — OpenDocument Text / LibreOffice Writer
- [`odp`](../odp/SKILL.md) — OpenDocument Presentation / LibreOffice Impress
- [`odg`](../odg/SKILL.md) — OpenDocument Graphics / LibreOffice Draw
