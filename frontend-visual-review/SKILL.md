---
name: frontend-visual-review
description: Investigate frontend issues with Playwright, screenshots, console logs, network evidence, and UI smoke checks.
compatibility: opencode
---
## When to use
- UI is broken, layout is off, browser console shows errors, or a screenshot needs analysis.

## Procedure
1. Capture the current state with Playwright or a provided screenshot.
2. Check browser console messages.
3. Check failed or suspicious network requests.
4. Compare visual symptoms with DOM and runtime evidence.
5. Verify the fix with a smoke pass.

## Rules
- Do not rely on visual guessing alone.
- Prefer browser and runtime evidence.
