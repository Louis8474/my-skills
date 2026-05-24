---
name: grounded-analysis
description: Answer only from verified evidence and refuse to guess when certainty is incomplete.
compatibility: opencode
---
## When to use
- The task is fact-sensitive, version-sensitive, high-stakes, or must avoid assumptions.

## Procedure
1. Gather evidence from repository files, diagnostics, logs, tests, and explicit command output.
2. Evaluate whether the evidence is enough for a certain answer.
3. If yes, answer with evidence-backed confidence.
4. If not, stop and return `INSUFFICIENT INFORMATION` plus a concrete evidence checklist.

## Rules
- Do not fill gaps with assumptions.
- Separate what is known from what is missing.
