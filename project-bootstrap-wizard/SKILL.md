---
name: project-bootstrap-wizard
description: Interview the user, inspect the current repository, and bootstrap project-specific OpenCode intelligence safely.
compatibility: opencode
---
## When to use
- A repository needs project-specific OpenCode rules generated from real repo evidence and user preferences.

## Required flow
1. Call `project_intelligence_status` first.
2. Confirm the detected target path with the user before writing anything.
3. Inspect repo evidence before asking questions.
4. Ask only blocking or ambiguity-reducing follow-up questions.
5. Normalize the result into a structured project profile.
6. Generate concise project-specific rules.
7. Persist the result through `project_intelligence_apply`.

## What to collect
- languages and versions
- frameworks and major tooling
- testing stack
- CI system
- runtime environment
- package/build tools
- quality tools
- debugging preferences
- verification strictness
- documentation expectations

## Rules
- The user may answer in free form.
- The wizard should infer what it can from the repository first.
- Never write project rules outside the confirmed repository.
