# WIKI.md — LLM Wiki Operating Schema

## Purpose

This wiki is a persistent, compounding knowledge base maintained by an LLM agent.

## Layers

1. `raw/` contains immutable sources.
2. `wiki/` contains LLM-maintained Markdown pages.
3. `WIKI.md` and `AGENTS.md` define operating conventions.

## Non-negotiable rules

- Do not edit files under `raw/`, except moving a source from `raw/inbox/` to `raw/processed/` when explicitly instructed.
- Do not invent citations or source details.
- Update `wiki/index.md` after every ingest or new page creation.
- Append an entry to `wiki/log.md` after every ingest, saved query, compile or lint pass.
- Preserve uncertainty explicitly.
- When a new source contradicts an older page, do not silently erase the contradiction. Mark it and explain the competing claims.

## Page types

- Source pages: `wiki/sources/`
- Entity pages: `wiki/entities/`
- Concept pages: `wiki/concepts/`
- Synthesis pages: `wiki/syntheses/`
- Question pages: `wiki/questions/`

## Citation convention

Prefer stable relative file references:

```text
Source: [[sources/source-title]]
Raw: `raw/processed/source-title.md`
Evidence: quoted or paraphrased claim, with location if available.
```

## Ingest workflow

1. Read the raw source.
2. Create or update one source page.
3. Identify entities, concepts and claims.
4. Update existing entity/concept pages.
5. Create missing pages only when the concept/entity is likely to recur.
6. Update `wiki/index.md`.
7. Append to `wiki/log.md`.
8. Report changed files and unresolved uncertainties.

## Query workflow

1. Read `wiki/index.md`.
2. Read relevant pages.
3. Answer using the wiki as primary context.
4. Cite pages and sources.
5. Offer to save the answer as a synthesis page when it has lasting value.

## Lint workflow

Check for:

- orphan pages;
- pages missing frontmatter;
- concepts mentioned repeatedly but lacking pages;
- contradictions;
- stale claims;
- missing source references;
- broken wiki links;
- log/index inconsistency.
