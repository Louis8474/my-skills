---
name: odp
description: "Create, read, edit, convert, repair, or inspect OpenDocument Presentation files (.odp). Supports shape animations (entrance, exit, emphasis, motion paths), slide transitions, and master-page customization."
triggers: [".odp", "ODP", "OpenDocument Presentation", "Open Office presentation", "LibreOffice Impress", "Impress deck", "odp-Datei", "OpenDocument-Präsentation", "Folien", "Präsentation", "animation", "Animation", "transition", "Übergang", "Folienübergang", "slide transition", "master page", "master slide", "Folienmaster", "flat ODF", ".fodp"]
dont_use_for: ["text documents (.odt)", "spreadsheets (.ods)", "general presentation advice without .odp file"]
license: MIT
version: "1.2.0"
---

# ODP creation, editing, and analysis

## Overview

An `.odp` file is an OpenDocument ZIP package for presentations. Important package files:

- `mimetype` - should be the first ZIP entry and stored uncompressed as `application/vnd.oasis.opendocument.presentation`
- `content.xml` - slides, shapes, text boxes, images, speaker notes
- `styles.xml` - presentation, drawing, and text styles
- `meta.xml` - document metadata
- `settings.xml` - application settings
- `META-INF/manifest.xml` - package manifest
- `Pictures/...` - embedded media

## Quick Reference

| Task | Preferred approach |
|------|--------------------|
| Create branded deck | Start from an `.odp` template, clone slides/masters, edit XML |
| Create simple structured deck | Generate ODP package XML directly |
| Convert PPTX/HTML/SVG to ODP | Use LibreOffice only when the source already exists or interoperability requires it |
| Extract text | Use `scripts/extract_text.py` or parse `content.xml` |
| Preserve template layout | Edit the existing ODP package XML and media references |
| Visual QA | Convert to PDF or slide images and inspect every slide |

## Tool Checks

Before starting a real ODP task, check available tools:

```bash
which pandoc
```

Resolve the LibreOffice command as described in [docs/soffice-resolver.md](../../docs/soffice-resolver.md).

LibreOffice is the preferred engine for ODP conversion and rendering. Pandoc is not a full ODP authoring or inspection tool.

## Reading and Inspecting

For raw inspection:

```bash
unzip -l input.odp
python -m zipfile -e input.odp unpacked_odp
```

Slide content is usually in `content.xml` under `draw:page` elements. Extract text with an XML parser, keeping namespace handling explicit.

Bundled scripts for common inspection tasks:

```bash
# Extract visible slide text and speaker notes.
python scripts/extract_text.py input.odp
python scripts/extract_text.py input.odp --json

# Inspect package files, media references, slide metadata, notes, and master pages.
python scripts/inspect_package.py input.odp
```

For the full script reference, see [docs/script-reference.md](../../docs/script-reference.md#odp).

Useful things to inspect:

- `draw:page` elements for slide order and names
- `draw:frame` and `draw:text-box` for positioned content
- `text:p` and `text:list` for visible slide text
- `presentation:notes` for speaker notes
- `draw:image` references for embedded media

## content.xml Structure

An ODP presentation normally stores slides in `content.xml` under this broad path:

```text
office:document-content
  office:body
    office:presentation
      draw:page
```

Each `draw:page` is one slide. Important attributes commonly include:

- `draw:name` - slide name, often visible in Impress navigation
- `draw:style-name` - slide/page style reference
- `draw:master-page-name` - links the slide to a master page
- `presentation:presentation-page-layout-name` - placeholder/layout behavior
- `presentation:use-header-name`, `presentation:use-footer-name`, `presentation:use-date-time-name` - header/footer/date-time bindings when present

Typical slide children:

- `draw:frame` - positioned container for text boxes, images, objects, charts, or plugins
- `draw:text-box` inside `draw:frame` - text box content
- `text:p`, `text:span`, `text:list` - visible text runs and lists
- `draw:image` - embedded or linked image reference, usually via `xlink:href`
- `draw:custom-shape`, `draw:rect`, `draw:ellipse`, `draw:line`, `draw:connector`, `draw:path` - vector shapes
- `presentation:notes` - speaker notes and notes-page content for that slide
- `anim:par` / animation elements - slide animations or transitions when present

### Speaker Notes

Speaker notes live inside the slide's `draw:page`, usually as a `presentation:notes` child. Notes may contain their own drawing page/frame structure, not just plain text:

```text
draw:page
  ... visible slide shapes ...
  presentation:notes
    draw:page-thumbnail
    draw:frame
      draw:text-box
        text:p
```

When extracting notes, gather text under `presentation:notes` separately from visible slide text. When editing visible slide text, avoid accidentally modifying notes text with broad `text:p` searches.

### Master Pages

Master pages are usually defined in `styles.xml`, not `content.xml`, under:

```text
office:document-styles
  office:master-styles
    style:master-page
```

Slides connect to masters through `draw:page/@draw:master-page-name`. A `style:master-page` can reference page layouts and include background shapes, logos, footer placeholders, and presentation placeholders. Common attributes and children include:

- `style:name` - the value referenced by `draw:master-page-name`
- `style:page-layout-name` - page size and margins through a page layout style
- `draw:frame`, `draw:rect`, `draw:image`, `draw:text-box` - master-level visible/background objects
- `presentation:placeholder` or presentation classes on frames - title/body/footer/date placeholders

When changing a repeated background, footer, logo, or title placeholder, inspect the matching `style:master-page` first. Editing each slide separately is only appropriate when the content is slide-specific.

### Style and Layout Links

ODP content uses many name-based references across `content.xml` and `styles.xml`:

- `draw:style-name` points to drawing/graphic styles
- `text:style-name` points to paragraph or text styles
- `draw:text-style-name` can control text inside drawing objects
- `presentation:style-name` and presentation layout names can control placeholder behavior
- `draw:master-page-name` points from a slide to a master page

Before deleting or renaming a style or master page, search both `content.xml` and `styles.xml` for the name. Broken style references often render as layout shifts rather than obvious validation errors.

## Creating ODP Files

ODP is an XML package and can be generated directly. Do not default to PPTX as an intermediate just because PPTX tooling exists.

Choose the creation path by fidelity needs:

| Scenario | Use |
|----------|-----|
| Branded deck, recurring layouts, exact master/footer/logo behavior | Template-first ODP |
| Simple generated deck with title/body/image/diagram slides | Direct ODP XML generation |
| Existing PPTX/HTML/SVG source or explicit cross-format conversion | LibreOffice conversion fallback |

### Template-First ODP

Use this when visual consistency matters or a user provides an `.odp` template.

1. Extract the template.
2. Inspect `styles.xml` master pages and `content.xml` slide structures.
3. Clone a known-good `draw:page` for each needed layout.
4. Replace text, media references, and coordinates with XML-aware edits.
5. Add images under `Pictures/` and update `META-INF/manifest.xml`.
6. Repack and run the full QA loop.

This is usually the safest path for branded or institutional decks because it preserves master pages, placeholders, fonts, footers, and page settings.

### Direct ODP XML Generation

Use this for simple or highly structured generated decks. Generate a minimal package with:

- `mimetype`
- `content.xml`
- `styles.xml`
- `meta.xml`
- `settings.xml`
- `META-INF/manifest.xml`
- optional `Pictures/...`

Minimum slide structure:

```text
office:body
  office:presentation
    draw:page draw:name="Slide 1" draw:master-page-name="Default"
      draw:frame svg:x="1cm" svg:y="1cm" svg:width="24cm" svg:height="2cm"
        draw:text-box
          text:p text:style-name="Title"
```

When generating directly, keep the first version deliberately small: title/body/image slides, a small style set, one or two masters, and no animations until the PDF/PNG render is stable.

### Conversion Fallback

Use LibreOffice conversion when the source already exists in another format or when interoperability is the actual task:

```bash
# Resolve SOFFICE as shown in Tool Checks.
"$SOFFICE" --headless --convert-to odp source.pptx --outdir out
"$SOFFICE" --headless --convert-to pdf out/source.odp --outdir qa
```

Treat conversion as lossy until QA proves otherwise. Check fonts, images, connectors, masters, notes, and placeholder behavior after every conversion.

## Presentation Styling and Branding

`create_minimal_odp.py` emits a designed default theme, not raw frames:

- A real `drawing-page` style (`dp-default`) sets the slide background and is
  referenced by the master page through `draw:style-name`.
- Each `draw:frame` references a `graphic`-family style (`gr-title`,
  `gr-body`, `gr-notes`, `gr-image`) with `draw:fill="none"` and
  `draw:stroke="none"`. **Without a graphic style a frame inherits
  LibreOffice's default fill and renders as a blue box** — always give
  generated frames an explicit `draw:style-name`.
- Paragraph styles `Title`/`Body`/`Notes` carry an explicit `fo:color`.

Two ways to brand a deck:

1. **Whole-theme swap** — write a curated `styles.xml` that redefines the
   same named styles (`dp-default`, `gr-title`, `gr-body`, `Title`, `Body`,
   master `Default`, layout `Screen`) and inject it:

   ```python
   from odp_common import embed_pictures, inject_styles_from_file
   inject_styles_from_file("base.odp", "branded-styles.xml", "styled.odp")
   embed_pictures("styled.odp", {"Pictures/logo.png": "logo.png"}, "deck.odp")
   ```

   Because content references styles by name, no edit to `content.xml` is
   needed. See [examples/deck/](../../examples/deck/) for a complete
   branded-deck build.

2. **Per-master tweak** — use `customize_master.py` for a background colour,
   header/footer, page numbers, or a logo on one master page. The background
   colour is written into the `drawing-page` style the master references
   (setting it on the master element itself does not render).

## Bundled Scripts

For creation and editing scripts, see [docs/script-reference.md](../../docs/script-reference.md#odp).
All scripts use the Python standard library and are invoked as:

```bash
python scripts/<script_name>.py [args]
```

Keep direct generation deliberately small unless a task needs more: title/body/image slides, simple notes, a small style set, and QA-rendered output.

## ODP Slide Design Checklist

Use this checklist when creating or materially redesigning ODP slides. ODP decks should be designed for LibreOffice Impress rendering first, then checked for export stability.

### Master and Layout Discipline

- Put repeated backgrounds, logos, slide numbers, footers, and section markers on master pages, not duplicated on every slide.
- Use a small set of master pages/layouts; too many near-duplicate masters make XML edits and QA brittle.
- Keep title, body, footer, date, and page-number placeholders aligned across related masters.
- Verify that each slide's `draw:master-page-name` points to the intended master after conversions or cloning.
- For section divider slides, use a dedicated master or layout rather than manually overriding many objects.

### Text and Typography

- Use fonts likely to exist on the target system, or verify export output after font substitution.
- Keep text boxes slightly larger than the expected text; Impress line breaking can differ from PowerPoint or browser renderers.
- Avoid tiny text below 12 pt for projected decks; use 14-18 pt as a safer body range.
- Keep title boxes high and consistent, but allow enough vertical space for two-line titles.
- Prefer real list structures where practical; avoid manually typed bullets if later XML editing is expected.

### Shapes, Connectors, and Diagrams

- Use connector objects for diagrams that need to stay attached to shapes; verify routing after moving shapes.
- Leave enough spacing around connector endpoints so rerouting does not cross labels.
- Keep grouped objects simple. Deeply nested groups are harder to edit safely in `content.xml`.
- Use consistent stroke widths and arrowheads across a deck; conversion can make small inconsistencies more visible.
- For process diagrams, align objects numerically or through template duplication rather than eyeballing every slide.

### Images and Media

- Embed critical images in the ODP package rather than linking to local files.
- Preserve image aspect ratios; set crop/frame behavior deliberately.
- Use sufficient image resolution for PDF export, but avoid enormous media that makes ODP editing slow.
- Check `META-INF/manifest.xml` after adding images manually.
- Prefer SVG for simple icons and diagrams if LibreOffice renders them correctly in the target environment; otherwise render to PNG at adequate resolution.

### Export-Stable Visual Choices

- Avoid relying on subtle transparency, complex gradients, shadows, or blend effects unless PDF/PNG QA proves they survive.
- Keep charts and embedded objects simple, or rasterize/export them deliberately when fidelity matters more than editability.
- Use high contrast for projected decks and PDF handouts.
- Keep important content away from slide edges; exported PDFs may expose tight margins.
- Avoid animation-dependent meaning unless the user explicitly needs a live Impress deck.

### Slide Composition

- Every slide should have a clear visual hierarchy: title, primary content, supporting detail.
- Use one dominant idea per slide; split crowded ODP slides rather than shrinking text.
- Align objects to a consistent grid or repeated coordinates.
- Reserve master-level footer/navigation space so content does not collide with it.
- For diagram-heavy slides, include enough whitespace around labels and connectors for export drift.

## Editing Existing ODP Files

For content/layout-preserving edits:

1. Extract the package.
2. Parse `content.xml` with an XML library.
3. Edit slide text, images, or shape attributes while preserving namespaces and style names.
4. Add new media under `Pictures/` and update `META-INF/manifest.xml`.
5. Repack with `mimetype` first and uncompressed.
6. Convert to PDF/images for visual QA.

Repack pattern:

```bash
cd unpacked_odp
zip -0 -X ../output.odp mimetype
zip -r -X ../output.odp . -x mimetype
```

## QA (Required)

Assume generated or edited ODP files have problems until proven otherwise. ODP round-trips through LibreOffice can change fonts, connector routing, image sizing, placeholder behavior, and master-page inheritance.

### Content QA

Extract visible text and notes:

```bash
python scripts/extract_text.py output.odp
python scripts/extract_text.py output.odp --json > qa/text.json
```

Check:

- slide count and order
- missing, duplicated, or stale slide text
- speaker notes preserved separately from visible slide text
- leftover placeholder text such as `Lorem`, `TODO`, `XXXX`, or template instructions
- expected title/body/footer text on slides using master placeholders

### Package QA

Inspect the package before visual review:

```bash
python scripts/inspect_package.py output.odp > qa/package.json
```

Check:

- `mimetype` is first
- `content.xml`, `styles.xml`, `meta.xml`, and `META-INF/manifest.xml` exist
- media referenced by `draw:image/@xlink:href` exists in the package
- slides reference existing master pages through `draw:master-page-name`
- slides with expected speaker notes report `has_notes: true`
- frame and image counts look plausible after edits

If you changed masters, backgrounds, logos, footers, or placeholders, inspect both `content.xml` and `styles.xml` for broken style/master references before rendering.

### Visual QA

Render to PDF and, when possible, PNG slide images:

```bash
python scripts/render.py output.odp --outdir qa --png
```

If PNG rendering is unavailable, at least produce the PDF:

```bash
python scripts/render.py output.odp --outdir qa
```

Inspect every rendered slide. Look for:

- text overflow, clipped titles, or text shifted outside frames
- missing images, wrong crop/aspect ratio, or low-resolution replacements
- connectors detached from shapes or routed awkwardly
- master-page backgrounds, logos, footers, or slide numbers missing
- notes accidentally visible on the slide canvas
- font substitution changing line breaks or causing crowding
- charts or embedded objects rasterized poorly
- slide size or orientation mismatches
- unexpected animation/transition loss if those mattered to the request

### Verification Loop

1. Extract content and package summaries.
2. Render to PDF/PNG.
3. List concrete issues found, even if minor.
4. Fix the ODP source, package XML, or intermediate source deck.
5. Re-run the relevant extraction/inspection/rendering steps.
6. Do not deliver until a final pass shows no unresolved content, package, or visual issues relevant to the user's request.

For template-based decks, always verify at least one slide using each master page/layout that was touched.

## ODP Notes

- ODP uses drawing coordinates and style references; minor XML edits can have large visual effects.
- Fonts may substitute differently in LibreOffice, PowerPoint, and browser previewers. Render with the target app when possible.
- Keep aspect ratios explicit for images.
- Prefer template-based work for branded decks.

## See also

Part of the [open-document-skills](https://github.com/leiverkus/open-document-skills) suite:

- [`odt`](../odt/SKILL.md) — OpenDocument Text / LibreOffice Writer
- [`ods`](../ods/SKILL.md) — OpenDocument Spreadsheet / LibreOffice Calc
- [`odg`](../odg/SKILL.md) — OpenDocument Graphics / LibreOffice Draw
