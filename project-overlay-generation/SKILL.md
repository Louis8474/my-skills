---
name: project-overlay-generation
description: Turn repository evidence and user answers into persistent project-specific rules, profile data, and workflow artifacts.
compatibility: opencode
---
## When to use
- A project overlay needs to be created or refreshed.

## Output contract
- `PROJECT_PROFILE.json` contains normalized structured data.
- `PROJECT_RULES.generated.md` contains human-readable project rules.
- `LEARNED_RULES.generated.md` stays separate from generated project rules.
- Local `opencode.json` references generated project rule files through `instructions`.

## Rules
- Preserve existing local config unless a safe merge is impossible.
- Prefer readable project rules over giant dumps of raw config.
- Keep learned rules separate from the initial generated rules.
