# LLM Wiki for OpenClaw

LLM Wiki is a Markdown-first workflow for building persistent, LLM-maintained
knowledge bases from immutable raw sources.

This OpenClaw skill can initialize a wiki vault, ingest sources, answer from the
wiki, save durable syntheses, and run lint/check workflows.

Main repository:

https://github.com/tonypalmisano/llm-wiki

## Install In An OpenClaw Workspace

Copy this folder into an OpenClaw workspace:

```text
<workspace>/skills/llm_wiki
```

Then start or restart OpenClaw so the workspace skill is discovered.

## Example Commands

```text
/llm_wiki init
/llm_wiki init --dry-run
/llm_wiki ingest raw/inbox/example.md
/llm_wiki query Why is LLM Wiki different from temporary retrieval?
/llm_wiki lint
```

`/llm_wiki init` initializes the current OpenClaw workspace automatically. It is
non-destructive, creates only missing directories and files, and does not
overwrite existing files. Use `/llm_wiki init --dry-run` to preview changes
before writing them.

No separate `/llm_wiki_init` command is needed.

Durable answers can also be saved as synthesis pages:

```text
Save that answer as a synthesis.
```

## Plain Markdown Fallback

Plain Markdown fallback is the default behavior. The skill operates directly on:

```text
raw/
wiki/
```

It creates and maintains pages under:

```text
wiki/sources/
wiki/entities/
wiki/concepts/
wiki/syntheses/
wiki/questions/
```

It also updates `wiki/index.md` and appends to `wiki/log.md` after meaningful
wiki changes.

## Optional memory-wiki Backend

OpenClaw memory-wiki is optional. If available and requested, it can be used as
an advanced backend for OpenClaw-native status, ingest, search, compile or lint
workflows.

The skill should disclose the backend it uses:

```text
Backend: plain Markdown fallback
Backend: OpenClaw memory-wiki
```

If memory-wiki is unavailable or ambiguous, the skill should continue in plain
Markdown fallback mode.

## Security And Safety

- Raw sources must remain immutable.
- Citations and source details must not be invented.
- Uncertainty and contradictions should be preserved.
- Meaningful operations should be logged.
- The skill must not execute remote code.
- The skill must not install dependencies automatically.
- memory-wiki is not required.

## ClawHub

The intended ClawHub slug is:

```text
llm-wiki
```

Review the package before publishing. Do not publish directly from automation
without checking `SKILL.md`, scripts, templates and metadata.
