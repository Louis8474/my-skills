---
name: llm-wiki-full
description: Maintain a Markdown-first LLM Wiki knowledge base from immutable raw sources. Use for /llm_wiki init, ingest, query, synthesis saving, lint/check, compile and persistent wiki maintenance. Plain Markdown fallback is the default; OpenClaw memory-wiki is optional when available.
version: 0.4.3
homepage: https://github.com/tonypalmisano/llm-wiki
license: MIT-0
---

# LLM Wiki Skill for OpenClaw

LLM Wiki is a Markdown-first workflow for building a persistent, compounding
knowledge base with LLM agents.

The skill turns raw source material into maintained Markdown pages under
`wiki/`, keeps an index and log, preserves uncertainty, and can save durable
answers as synthesis pages.

## Supported Operations

Use this skill when the user asks to:

- initialize an LLM Wiki vault;
- ingest a source into the wiki;
- create or update source, concept, entity, question or synthesis pages;
- query the wiki and answer from existing pages;
- save a durable answer as a synthesis;
- lint or health-check a wiki;
- compile or refresh derived wiki pages.

## Backend Modes

Always disclose the backend before performing a meaningful operation.

### Plain Markdown fallback

Default mode:

```text
Backend: plain Markdown fallback
```

Use this mode when OpenClaw memory-wiki is unavailable, the user asks for a
portable Markdown vault, or the OpenClaw-native backend is ambiguous.

Operate directly on files:

```text
raw/
  inbox/
  processed/
  assets/

wiki/
  WIKI.md
  AGENTS.md
  index.md
  log.md
  sources/
  entities/
  concepts/
  syntheses/
  questions/
```

### Optional OpenClaw memory-wiki backend

Optional advanced mode:

```text
Backend: OpenClaw memory-wiki
```

OpenClaw memory-wiki is not required. Use it only when it is available and the
user wants OpenClaw-native behavior.

Useful commands may include:

```bash
openclaw wiki status
openclaw wiki init
openclaw wiki ingest <path-or-url>
openclaw wiki compile
openclaw wiki lint
openclaw wiki search <query>
openclaw wiki get <page>
```

If a memory-wiki command is unavailable, fails, or does not preserve the LLM Wiki
contract, fall back to plain Markdown mode and report that choice.

### Hybrid compatibility mode

Use hybrid mode when memory-wiki helps with backend/search/compile behavior but
the visible LLM Wiki vault still needs Markdown interoperability.

In hybrid mode:

- use memory-wiki only for operations it cleanly supports;
- keep `wiki/index.md` and `wiki/log.md` understandable;
- preserve LLM Wiki page conventions and review metadata;
- report changed files or pages after each operation.

## Commands

### `/llm_wiki init [path]`

Initialize the vault structure in plain Markdown fallback mode.

For init, prefer the deterministic helper script instead of manual filesystem
tool orchestration:

```bash
python3 skills/llm_wiki/scripts/init_wiki.py
```

`/llm_wiki init` should run the helper with no path so it can automatically
detect the OpenClaw workspace. `/llm_wiki init --dry-run` should run:

```bash
python3 skills/llm_wiki/scripts/init_wiki.py --dry-run
```

Only use manual filesystem operations if the helper is unavailable. When manual
fallback is necessary, create missing directories and files only, copy templates
when available, and never overwrite existing files.

For OpenClaw slash-command mode:

- do not call `read()` on directories;
- do not use `node:auto`;
- do not ask the user for internal OpenClaw paths unless automatic workspace
  detection fails.

### `/llm_wiki ingest <source-path>`

1. Read the source.
2. Treat raw sources as immutable.
3. Create or update a source page under `wiki/sources/`.
4. Extract entities, concepts, claims and contradictions.
5. Create or update concept pages under `wiki/concepts/`.
6. Create or update entity pages under `wiki/entities/` when useful.
7. Update `wiki/index.md`.
8. Append to `wiki/log.md`.
9. Report changed files, backend used and unresolved uncertainties.

### `/llm_wiki query <question>`

1. Read `wiki/index.md` or use memory-wiki search when in memory-wiki mode.
2. Locate relevant wiki pages.
3. Read source pages when evidence is needed.
4. Answer with citations to wiki/source pages.
5. Preserve uncertainty when evidence is incomplete.
6. If the answer is durable, ask whether to save it as a synthesis unless the
   user already requested saving.

### Save synthesis

When the user asks to save a durable answer:

1. Create or update a synthesis page under `wiki/syntheses/`.
2. Include review metadata and claim metadata when possible.
3. Update `wiki/index.md`.
4. Append to `wiki/log.md`.
5. Report review warnings or unsupported claims clearly.

### `/llm_wiki lint` or `/llm_wiki check`

Check for:

- broken links;
- orphan pages;
- stale claims;
- contradictions;
- missing source references;
- pages missing frontmatter;
- index/log inconsistency;
- synthesis review warnings.

Use `scripts/check_wiki.py` if available, but also reason semantically about the
wiki.

### `/llm_wiki compile`

Refresh derived pages such as index, dashboards, topic maps and summary tables.

## Safety Rules

- Never modify raw sources.
- Never invent citations, source details or evidence.
- Preserve uncertainty and contradictions.
- Prefer small, reviewable edits.
- Log every meaningful operation.
- Do not execute remote code.
- Do not install dependencies automatically.
- Do not make memory-wiki a requirement.
- Do not duplicate memory-wiki internals.
- If a new source contradicts an old claim, mark the contradiction rather than
  silently overwriting it.
