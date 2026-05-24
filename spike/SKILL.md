---
name: spike
description: |
  Generate well-structured Jira Spike tickets in Jira Markdown syntax. Use when the user wants to create a spike, investigation task, technical research task, or feasibility study for Jira. Triggers include requests like "create a spike", "write a Jira spike", "I need a spike for [topic]", or any request to document a technical investigation or research task as a Jira ticket.
  También se activa en castellano: "crear un spike", "escribir un spike",
  "spike de investigación", "tarea de investigación", "investigación técnica",
  "spike en Jira", "necesito un spike para", "estudio de viabilidad",
  "ticket de investigación", "spike técnico", "hacer un spike",
  "documentar investigación", "crear tarea de investigación".
license: MIT
metadata:
  author: andresnator
  version: "1.0.0"
---

# Building Spike Tickets

A **spike** is a time-boxed investigation ticket whose goal is to reduce uncertainty before committing to a solution. It answers a specific technical question — it does not deliver functionality. When the spike is done, you close it and create follow-up stories based on what you learned.

Generate minimal Jira Spike tickets. Output in **English**, **Jira Markdown**, inside a code block.

## When to Create a Spike

Create a spike when the team cannot estimate a story because something is unknown:

- Technology feasibility: "Can we integrate X with Y?"
- Architecture uncertainty: "Which of these two approaches should we take?"
- Performance unknowns: "Will this scale to N requests?"
- Third-party API exploration: "What does this API actually support?"
- Security or compliance questions: "How does the library handle auth?"

A spike is **not** needed when the team already knows how to do the work. If the answer is obvious, skip the spike and write the story directly.

## Output Format

1. List 3 title suggestions outside the code block (`Spike: [Action] [Subject] for [Context]`)
2. Output the ticket in a single code block using this template:

```
h2. Problem Statement
[2-3 sentences: what is unknown and why it matters.]

h2. Research Questions
* [Question 1]
* [Question 2]
* [Question 3]

h2. Activities
* [ ] [Task 1]
* [ ] [Task 2]
* [ ] [Task 3]

h2. Definition of Done
* Go/No-Go decision with rationale.
* Refined follow-up ticket ready for sprint planning (if a bug or action is needed).
```

Keep all sections brief. No filler text.

## After the Spike

Once the investigation is done, document findings directly in the Jira ticket using the local findings template in [`assets/spike-findings-template.md`](assets/spike-findings-template.md).
