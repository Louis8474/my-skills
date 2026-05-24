---
name: bounded-loop
description: Run bounded iterative loops with explicit criteria, persisted state, compact summaries, and stop conditions.
compatibility: opencode
---
## When to use
- A task benefits from iterative generation with explicit quality gates.

## Loop contract
1. Confirm success criteria.
2. Confirm max iterations.
3. Persist loop state before the first iteration.
4. Iterate through PLAN -> PRODUCE -> VERIFY -> CRITIQUE -> REFINE.
5. Stop on threshold, no major blockers, iteration limit, user stop, or stagnation.

## Rules
- Keep the artifact on disk.
- Keep iteration summaries compact.
- Do not loop forever.
