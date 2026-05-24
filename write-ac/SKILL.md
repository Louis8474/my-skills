---
name: write-ac
description: |
  Generate structured Jira acceptance criteria in Gherkin format (Given/When/Then). Use when the user wants to define, write, or create acceptance criteria for a Jira task, story, or ticket. Triggers include "acceptance criteria", "AC", "write the ACs", "define ACs for", or any request to document expected behavior as testable conditions.
  También se activa en castellano: "criterios de aceptación", "CA", "escribir los criterios",
  "definir criterios de aceptación", "crear los CA", "ACs del ticket",
  "criterios Gherkin", "dado cuando entonces", "condiciones de aceptación",
  "escribir los ACs", "generar criterios", "criterios para esta historia",
  "definir los criterios".
license: MIT
metadata:
  author: andresnator
  version: "1.0.0"
---

# Building Acceptance Criteria

Generate acceptance criteria for Jira tickets. Output in **English**, **Jira Markdown**, inside a code block.

## Step 1 — Gather context

Before writing, verify you have the following. If any is missing, ask for it:

- **What** the feature or change does (business goal, not implementation detail)
- **Who** performs the action (user role or system actor)
- **What** the observable outcome is from a user/business perspective
- **Scope** restrictions if applicable (e.g., specific environments, feed-handlers, devices)

Ask only what is missing. Do not ask for things already provided.

## Step 2 — Write the ACs

Apply these quality rules to every criterion:

- **Binary**: Each AC must have a clear pass or fail. Avoid vague outcomes like "works correctly" or "is shown properly".
- **Testable**: The outcome must be verifiable through a concrete observable action — not inferred from code behaviour.
- **Implementation-independent**: Describe *what* the system does, not *how* it does it internally. Avoid referencing internal flags, class names, or code constructs unless they are part of the user-visible contract.
- **Business language**: Write so that any stakeholder (product owner, QA, business analyst) can understand it without technical knowledge.
- **Real scenario**: Ground each AC in an authentic business flow (e.g., "a user completes a purchase"), not an abstract system state.

## Output Format

Output the criteria in a single code block using this template:

```
h2. Acceptance Criteria

*AC.1* → Given [initial context / precondition], When [user or system action], Then [observable outcome].

*AC.2* → Given [initial context / precondition], When [user or system action], Then [observable outcome].
```

## Output Rules

- Each AC must be self-contained and testable.
- Use the `→` separator between the AC identifier and the Gherkin sentence.
- Keep each criterion to a single sentence. No bullet sub-lists inside an AC.
- If scope or feed-handlers apply, append them in parentheses at the end: `(DC, LF, BRU)`.
- Number sequentially starting at AC.1.
- No filler text. No preamble outside the code block.

## Example Output

```
h2. Acceptance Criteria

*AC.1* → Given a confirmed event total has been received for the current period, When the system processes the settlement, Then all affected markets are settled and their status is visible to the user as "Settled". (DC, LF, BRU feed-handlers.)

*AC.2* → Given an unconfirmed event total has been received, When the system processes it, Then no markets are settled and their status remains unchanged. (DC, LF, BRU feed-handlers.)
```
