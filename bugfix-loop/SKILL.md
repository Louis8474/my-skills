---
name: bugfix-loop
description: Diagnose and fix bugs using repro steps, logs, diagnostics, tests, and the smallest safe diff.
compatibility: opencode
---
## When to use
- A bug, regression, exception, broken flow, or failing test needs to be fixed.

## Procedure
1. Reproduce the issue or restate the exact failing scenario.
2. Collect evidence: error text, stack trace, project logs, browser logs, failing tests, LSP diagnostics.
3. Find the affected code path and neighboring tests.
4. Propose the smallest fix that explains the evidence.
5. Implement only the scoped fix.
6. Verify with targeted tests, diagnostics, and logs.

## Rules
- Do not guess before checking logs or diagnostics.
- Do not broaden the scope unless the evidence forces it.
- If the bug is larger than expected, escalate to a larger pipeline.
