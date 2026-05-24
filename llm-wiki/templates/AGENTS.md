# AGENTS.md — LLM Wiki Agent Guidance

This vault uses the LLM Wiki workflow.

## Operating rules

- Treat `raw/` as immutable source material.
- Maintain derived knowledge under `wiki/`.
- Update `wiki/index.md` and `wiki/log.md` after meaningful wiki changes.
- Do not invent citations, source details or evidence.
- Preserve uncertainty and contradictions explicitly.
- Prefer small, reviewable edits.

## Recommended check

```bash
python3 core/scripts/check_wiki.py .
```
