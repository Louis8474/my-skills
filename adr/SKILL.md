---
name: adr
description: "Generate Architecture Decision Records (ADR) in Markdown format."
license: "MIT"
metadata:
  author: andresnator
  version: 1.0.0
---

# ADR Creator

Generate a well-structured Architecture Decision Record (ADR) as a Markdown file.

## What is an ADR

An ADR captures **why** a specific architectural or technical decision was made, what alternatives were considered, and what trade-offs were accepted. ADRs are not implementation plans — they record the reasoning behind a choice so future team members understand the context.

## Process

1. Gather context from the user. Ask about:
   - **Title** — short name for the decision
   - **Status** — default to "In Progress" unless told otherwise
   - **Responsible / Accountable** — who is driving and who owns the outcome
   - **Consulted** — roles whose input was sought (e.g., Security Engineer, Architect, QA)
   - **Informed** — stakeholders who should be aware of the outcome
   - **Outcome** — one-line summary of what was decided
   - **Due date** — when the decision must be finalized
   - **Vertical / Team** — business vertical and team owning the decision
   - **Background** — the problem, constraints, or forces that require a decision
   - **Options considered** — at least two, ideally three, each with pros and cons
   - **Decision Outcome** — the chosen option and the justification for choosing it
   - **Consequences** — positive and negative effects of the chosen option
   - **Action items** — follow-up tasks resulting from the decision (optional)

2. If the user gives a vague request, ask one round of clarifying questions. Don't over-interrogate — work with what you have after one follow-up.

3. Read the template from `references/template-markdown.md` and fill it with the gathered context.

4. Output the ADR inside a single Markdown code block.

## Filling Rules

- **Background**: describe the problem that forced the decision. Focus on constraints and forces — not the solution.
- **Options Considered**: include at least two options, each with pros and cons. Remove Option 3 if only two exist.
- **Decision Outcome**: state the chosen option and explain *why* it beats the others. Be honest about trade-offs.
- **Consequences**: list positive and negative effects separately. Include follow-up actions if any.
- **RACI fields**: if the user doesn't know who to put in Consulted / Informed, leave them as "TBD".
- **Action Items**: follow-up tasks that result from the decision. Omit this section if none exist.

## Output Rules

- Output language: **English** always, regardless of the language the user writes in
- Never leave placeholder text — replace everything or mark as "TBD" if the user explicitly skipped it
- After presenting the ADR, offer: "Want me to adjust anything?"

## Reference

- **Template**: `references/template-markdown.md`

---

## Full Skill Description

<!-- auto-moved from frontmatter `description:` field because it exceeded codex's 1024-character limit. The frontmatter now has a shortened summary. Full original preserved verbatim below. -->

Generate Architecture Decision Records (ADR) in Markdown format. Use this skill whenever the user wants to create, write, draft, or document an architectural decision, a technical decision record, or an ADR. Triggers include "ADR", "architecture decision record", "decision record", "architectural decision", "document a decision", "technical decision", "record a decision", "create an ADR", "write an ADR", or any request to formally capture why a technical or architectural choice was made. Also trigger when the user says things like "we decided to use X instead of Y and I want to document it", "I need to justify this architecture choice", or "let's record this decision for the team". También se activa en castellano: "ADR", "registro de decisión arquitectónica", "decisión arquitectónica", "decisión técnica", "documentar una decisión", "registrar una decisión", "crear un ADR", "escribir un ADR", "registro de decisión", "decisión de arquitectura", "justificar una decisión técnica", "documentar por qué elegimos esta solución", "crear registro de decisión".
