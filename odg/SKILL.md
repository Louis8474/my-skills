---
name: odg
description: "Create, read, edit, convert, repair, inspect, or export OpenDocument Graphics/Drawing files (.odg). Supports diagramming: connectors with shape-to-shape binding, glue points, and shape groups for flowcharts, org charts, and mind maps."
triggers: [".odg", "ODG", "OpenDocument Graphics", "OpenDocument Drawing", "LibreOffice Draw", "OpenOffice Draw", "Draw document", "odg-Datei", "OpenDocument-Grafik", "Zeichnung", "diagram", "vector drawing", "connector", "Verbinder", "glue point", "Klebepunkt", "group", "Gruppe", "flowchart", "Flussdiagramm", "org chart", "Organigramm", "Mindmap", "flat ODF", ".fodg"]
dont_use_for: ["text documents (.odt)", "spreadsheets (.ods)", "presentations (.odp)", "generic image editing"]
license: MIT
version: "1.2.0"
---

# ODG creation, editing, and analysis

## Overview

An `.odg` file is an OpenDocument ZIP package for vector drawings, diagrams, and LibreOffice Draw documents. Important package files:

- `mimetype` - should be the first ZIP entry and stored uncompressed as `application/vnd.oasis.opendocument.graphics`
- `content.xml` - pages, shapes, connectors, text boxes, images, and drawing content
- `styles.xml` - drawing, text, page, and graphic styles
- `meta.xml` - document metadata
- `settings.xml` - application settings
- `META-INF/manifest.xml` - package manifest
- `Pictures/...` - embedded raster or vector media

## Quick Reference

| Task | Preferred approach |
|------|--------------------|
| Create simple drawing/diagram | Generate ODG package XML directly |
| Create branded/repeated diagram | Start from an `.odg` template and edit XML |
| Use SVG-first | Only when portable vector output matters more than Draw editability |
| Extract visible text | Use `scripts/extract_text.py` or parse `content.xml` |
| Inspect shapes/geometry | Use `scripts/extract_shapes.py` |
| Convert ODG to PDF/SVG/PNG | LibreOffice headless export |
| Visual QA | Export to PDF/PNG/SVG and inspect the rendered output |

## Tool Checks

Before starting a real ODG task, check available tools:

```bash
which pandoc
```

Resolve the LibreOffice command as described in [docs/soffice-resolver.md](../../docs/soffice-resolver.md).

## Reading and Inspecting

For raw package inspection:

```bash
unzip -l input.odg
python -m zipfile -e input.odg unpacked_odg
```

Drawing content is usually in `content.xml`. Inspect:

- `draw:page` for pages/canvases
- `draw:custom-shape`, `draw:rect`, `draw:ellipse`, `draw:path`, `draw:line`, and `draw:connector` for vector objects
- `draw:frame` and `draw:image` for embedded media
- `text:p` and `text:span` for visible text labels
- `style:style` references for fill, stroke, text, and positioning behavior

Use an XML parser with namespace support. Do not use regex for XML edits.

Bundled scripts for common inspection tasks:

```bash
python scripts/extract_text.py input.odg
python scripts/extract_shapes.py input.odg
python scripts/inspect_package.py input.odg
```

For the full script reference, see [docs/script-reference.md](../../docs/script-reference.md#odg).

## content.xml Structure

An ODG drawing normally stores pages in `content.xml` under:

```text
office:document-content
  office:body
    office:drawing
      draw:page
```

Important drawing elements and attributes:

- `draw:page` - one canvas/page; usually has `draw:name` and `draw:master-page-name`
- `draw:frame` - positioned container for images, text boxes, objects, or plugins
- `draw:text-box` - text container, normally inside a frame
- `text:p`, `text:span` - visible labels
- `draw:image` - embedded or linked image via `xlink:href`
- `draw:rect`, `draw:ellipse`, `draw:line`, `draw:path`, `draw:connector`, `draw:custom-shape` - vector objects
- `svg:x`, `svg:y`, `svg:width`, `svg:height` - geometry for many positioned objects
- `svg:x1`, `svg:y1`, `svg:x2`, `svg:y2` - line/connector endpoints
- `draw:style-name`, `draw:text-style-name` - style references

Styles and page layouts are usually defined in `styles.xml` and automatic styles in `content.xml`. Connector routing and glue points can be fragile; if you move connected shapes, visually verify connector positions after export.

## Creating ODG Files

ODG is an XML package and can be generated directly. Do not default to SVG conversion when the deliverable should remain editable in LibreOffice Draw.

Choose the creation path by the user's goal:

| Scenario | Use |
|----------|-----|
| Editable Draw diagram with simple shapes/connectors/text | Direct ODG XML generation |
| Branded diagram, repeated canvas, institutional styling | Template-first ODG |
| Portable vector graphic where Draw editability is secondary | SVG-first fallback |
| Existing SVG/PDF/PNG source or explicit export request | LibreOffice conversion/export fallback |

### Direct ODG XML Generation

Use this for simple diagrams and Draw-editable vector drawings:

```bash
python scripts/create_minimal_odg.py drawing.json output.odg
```

Keep direct generation deliberately small: pages, text boxes, rectangles, ellipses, lines, connectors, and images. Add custom paths, groups, glue points, and advanced styles only when a real task needs them.

### Template-First ODG

Use this when visual identity, repeated layout, logos, or exact page size matter.

1. Extract the template.
2. Inspect `content.xml` pages and `styles.xml` graphic/text/page styles.
3. Clone or edit known-good objects.
4. Replace labels, coordinates, media references, and style names XML-safely.
5. Add images under `Pictures/` and update `META-INF/manifest.xml`.
6. Repack and run the full QA loop.

### SVG-First Fallback

If an ODG deliverable is not strictly required, offer SVG or PDF as a more portable vector output. Use SVG-first only when portability matters more than Draw editability.

### Conversion Fallback

```bash
# Resolve SOFFICE as shown in Tool Checks.
"$SOFFICE" --headless --convert-to odg diagram.svg --outdir out
```

Treat conversion as lossy until QA proves otherwise. Check text, fonts, shapes, connectors, image embedding, and page size.

## Drawing Styling and Branding

`create_minimal_odg.py` emits a designed default theme, not raw shapes:

- A designed `standard` graphic style — named `standard` because LibreOffice
  treats it as the graphic-family default, so even a styleless shape inherits
  a sensible look instead of LibreOffice's generic `#729fcf` blue.
- Role styles (`gr-shape`, `gr-text`, `gr-line`, `gr-image`) parented to
  `standard`; every generated shape carries an explicit `draw:style-name`.
- A `drawing-page` style (`dp-default`) for the page background.

**Per-shape styling** — spec items accept optional styling keys:

| Key | Applies to | Example |
|---|---|---|
| `fill` | rect/ellipse/text | `"#F4C542"` or `"none"` |
| `stroke` | any shape | `"#7A5C00"` or `"none"` |
| `stroke-width` | any shape | `"0.05cm"` |
| `text-color` | any shape with text | `"#FFFFFF"` |
| `font-size` | any shape with text | `"20pt"` |
| `corner-radius` | rect | `"0.3cm"` |

`fill`/`stroke`/`stroke-width` produce a per-shape automatic *graphic* style;
`text-color`/`font-size` produce paragraph + text automatic styles — a graphic
style's text-properties are ignored by LibreOffice Draw from an automatic
style in `content.xml`.

**Whole-theme swap** — write a curated `styles.xml` that redefines the same
named styles (`standard`, `gr-shape`, `gr-text`, `gr-line`, `gr-image`,
`dp-default`, master `Default`, layout `Screen`) and inject it:

```python
from odg_common import embed_pictures, inject_styles_from_file
inject_styles_from_file("base.odg", "branded-styles.xml", "themed.odg")
```

Per-shape overrides live in `content.xml`, so a theme swap re-themes every
default-styled shape while the overrides survive. See
[examples/diagram/](../../examples/diagram/) for a complete branded build.

## Bundled Scripts

For creation and editing scripts, see [docs/script-reference.md](../../docs/script-reference.md#odg).
All scripts use the Python standard library and are invoked as:

```bash
python scripts/<script_name>.py [args]
```

## ODG Diagram Design Checklist

- Set explicit page/canvas size in the template or generated styles.
- Use consistent units such as `cm` for coordinates and dimensions.
- Keep text boxes larger than the expected label text; font substitution can change fit.
- Leave whitespace around connector endpoints so routing does not collide with labels.
- Keep groups shallow; deeply nested groups are harder to edit safely.
- Embed important images instead of linking local files.
- Use consistent stroke widths, arrowheads, fills, and label styles.
- For scientific diagrams, keep labels, legends, scales, and source notes readable after PDF/SVG export.
- Avoid subtle effects that may not survive LibreOffice export: complex transparency, shadows, gradients, blend effects.
- Verify PDF/SVG/PNG output before delivery.

## Editing Existing ODG Files

For layout-preserving edits:

1. Extract the package.
2. Parse `content.xml` and `styles.xml` with an XML library.
3. Modify shapes, text, coordinates, style references, or media links while preserving namespaces.
4. Add new media under `Pictures/` and update `META-INF/manifest.xml`.
5. Repack with `mimetype` first and uncompressed.
6. Export to PDF/SVG/PNG for visual QA.

Repack pattern:

```bash
cd unpacked_odg
zip -0 -X ../output.odg mimetype
zip -r -X ../output.odg . -x mimetype
```

## QA (Required)

Assume generated or edited ODG files have problems until proven otherwise. Draw rendering can change text fit, connector routing, image scaling, stroke widths, and page/canvas boundaries.

### Content QA

```bash
python scripts/extract_text.py output.odg > qa/text.txt
python scripts/extract_shapes.py output.odg > qa/shapes.json
```

Check labels, object counts, page names, expected shape types, and missing/duplicated text.

### Package and Geometry QA

```bash
python scripts/inspect_package.py output.odg > qa/package.json
python scripts/validate_refs.py output.odg
```

Check that `mimetype` is first, required XML files exist, media targets exist, manifest entries are present, style references are not broken, and geometry has no zero-size or suspicious negative-size objects.

### Visual QA

LibreOffice Draw export filters vary by installation. Prefer PDF for multi-page drawings, then SVG/PNG when useful:

```bash
python scripts/render.py output.odg --outdir qa --png
```

For multi-page ODG files, PDF export is usually the most reliable visual check. Inspect every page for missing images, shifted connectors, wrong fonts, clipped text, changed line widths, and page-size/canvas problems.

### Verification Loop

1. Extract text and shape summaries.
2. Validate package references and geometry.
3. Render to PDF/SVG/PNG as relevant.
4. List concrete issues found.
5. Fix XML, coordinates, styles, media, or source spec.
6. Re-run the relevant checks until no unresolved issues remain.

## ODG Notes

- ODG is best for Draw-specific diagrams, not general raster image editing.
- Coordinates and sizes may use units such as `cm`, `mm`, `in`, or `pt`; preserve units unless intentionally changing layout.
- Connectors can depend on glue points and object IDs. After moving shapes, verify connector routing visually.
- Embedded images require manifest entries and stable package paths.
- Font substitution can change text fit. Always render/export before delivering a user-facing ODG.

## See also

Part of the [open-document-skills](https://github.com/leiverkus/open-document-skills) suite:

- [`odt`](../odt/SKILL.md) — OpenDocument Text / LibreOffice Writer
- [`odp`](../odp/SKILL.md) — OpenDocument Presentation / LibreOffice Impress
- [`ods`](../ods/SKILL.md) — OpenDocument Spreadsheet / LibreOffice Calc
