---
name: llm-wiki
description: "Use this skill to maintain a persistent Markdown knowledge base from raw sources: initialize a vault, ingest sources, answer from the wiki, save durable syntheses, and lint the wiki."
---

# LLM Wiki Skill for Claude Code

Use this skill as a disciplined wiki-maintenance workflow.

## Core contract

- `raw/` is immutable source material.
- `wiki/` is maintained by Claude.
- `wiki/index.md` is the navigation catalog.
- `wiki/log.md` is append-only history.
- `wiki/WIKI.md` defines conventions.

## Operations

### Init

Create:

```text
raw/inbox/
raw/processed/
raw/assets/
wiki/sources/
wiki/entities/
wiki/concepts/
wiki/syntheses/
wiki/questions/
wiki/index.md
wiki/log.md
wiki/WIKI.md
wiki/AGENTS.md
```

### Ingest

For one source at a time:

1. Read the source.
2. Create a source page.
3. Update index and log.
4. Update entity and concept pages.
5. Flag contradictions explicitly.
6. Summarize changed files.

### Query

Answer from the wiki first. Read raw sources only when needed to verify evidence. Offer to save durable analysis as a synthesis page.

### Lint

Check links, orphans, missing citations, stale claims, contradictions and index/log drift.

## Rules

Never invent evidence. Never modify raw sources. Prefer small, reviewable patches.
