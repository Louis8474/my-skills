---
name: rfc
description: "Interactive skill for creating RFC (Request for Comments) documents as Markdown files."
license: "MIT"
metadata:
  author: andresnator
  version: 1.0.0
---

# RFC Creator — Interactive Interview & Markdown Generator

## Overview

This skill creates professional RFC (Request for Comments) documents by guiding the user through a structured interview. Instead of asking the user to fill in a template, the agent conducts a conversational interview, collecting information piece by piece, and then assembles a polished Markdown RFC at the end.

The goal is to make writing an RFC feel like a conversation, not paperwork.

## Interview Flow

The interview has **7 phases**. Walk the user through them one at a time. After each phase, summarize what you captured and confirm before moving on. When a question has clear bounded options, present those options plainly in chat and ask the user to choose one; use open-ended prose questions for everything else.

**Important behavioral notes:**
- Ask one phase at a time. Do not dump all questions at once.
- After the user answers, briefly reflect back what you understood and confirm it before proceeding.
- If the user gives a vague answer, ask a clarifying follow-up — but don't be annoying about it. One follow-up is enough; if they're still vague, work with what you have.
- If the user says "skip" or "not sure yet" for any section, mark it as TBD in the final document and move on.
- The user can say "go back" at any time to revise a previous section.

### Phase 1: Identity & Metadata

Collect the basic metadata for the RFC header.

Ask (open-ended):
- **Feature name**: "What's the name or short identifier for this proposal? (e.g., `async-worker-pool`, `user-auth-v2`SI )"
- **Author(s)**: "Who are the authors? (names or handles)"

Then ask with bounded options:
- **Type**: single_select from ["Feature", "Enhancement", "Bug Fix", "Deprecation", "Process Change", "Other"]
- **Status**: single_select from ["Draft", "In Review", "Accepted", "Rejected", "Superseded"]

Auto-fill the start date with today's date.

### Phase 2: Related Context

Ask (open-ended):
- "Are there related components, services, or systems this affects?"
- "Any related tickets, issues, or prior RFCs to reference? (JIRA, GitHub issues, links, etc.)"

These are optional — if the user has nothing, skip gracefully.

### Phase 3: Summary

Ask (open-ended):
- "Give me a one-paragraph summary of this proposal. What is it, at a high level?"

If the user gives a long explanation, distill it to a concise paragraph and confirm: "Here's how I'd summarize that — does this capture it?"

### Phase 4: Motivation

Ask (open-ended):
- "Why is this needed? What problem does it solve or what use case does it support?"
- "What happens if we don't do this?"

These two answers get combined into the Motivation section.

### Phase 5: Detailed Design

This is the meatiest section. Approach it conversationally:

- "Walk me through the design. How would this work?"
- Follow up with clarifying questions based on what they describe:
  - "How does X interact with Y?"
  - "What happens in the edge case where...?"
  - "Can you give me a concrete example of how a user/developer would use this?"

If the user provides code snippets, diagrams (in text), or API shapes, include them in the final RFC as fenced code blocks.

Encourage specificity, but respect the user's level of detail. Not every RFC needs to be an implementation spec — some are directional.

### Phase 6: Trade-offs & Alternatives

Ask with bounded options for the first question, then open-ended for the rest:
- **Have you considered alternatives?**: single_select ["Yes, I have specific alternatives", "I have some rough ideas", "No, I haven't thought about it yet"]

Then depending on their answer:
- If they have alternatives: "What alternatives did you consider and why did you choose this approach over them?"
- If rough ideas: "Tell me what you've got — even half-formed ideas are useful to capture."
- If none: "That's fine. Let me ask it differently — what's the main drawback or risk of this proposal?"

Also ask:
- "What are the drawbacks of this approach? Why might someone argue against it?"

### Phase 7: Open Questions

Ask (open-ended):
- "What parts of this design are still unresolved or need further discussion?"
- "Is there anything you're specifically looking for feedback on?"

## Generating the RFC

Once all phases are complete (or the user says "that's everything"), generate the RFC as Markdown. Save it as a file when the active environment provides file-writing capability; otherwise return the complete Markdown inline.

### Output Template

Read the template at `references/template.md` and use that exact structure for the generated `.md` file.

### File Generation Rules

1. Name the file `rfc-[feature-id].md` where `[feature-id]` is the kebab-case version of the feature name.
2. Write it to the project-approved documentation or output directory when one exists. If no destination is configured, ask for the destination or return the RFC inline.
3. Share the resulting path or inline Markdown with the user using the current environment's normal file-sharing mechanism.
4. After presenting, offer: "Want me to adjust anything? I can also add extra sections like Implementation Plan, Timeline, or Security Considerations if you need them."

### Writing Quality

When assembling the RFC from the interview answers:
- Smooth out the language so it reads as a cohesive document, not a Q&A transcript.
- Expand terse answers into clear prose while preserving the user's intent.
- Preserve any technical detail, code, or examples verbatim.
- Use professional but approachable tone — an RFC should be clear and direct, not stuffy.
- If the user marked anything as TBD, include a visible `> **TBD**: [brief note]` callout so reviewers know it's intentionally unresolved.

## Optional Extended Sections

If the user requests them (or if they naturally come up during the interview), the RFC can include additional sections after "Unresolved Questions":

- **Implementation Plan**: Phases, milestones, estimated effort.
- **Timeline**: Target dates for review, implementation, rollout.
- **Security Considerations**: Threat model, auth implications, data handling.
- **Testing Strategy**: How this will be validated.
- **Rollback Plan**: How to revert if things go wrong.
- **Migration Plan**: Steps for transitioning from the current state.

Only include these if the user wants them — don't bloat the RFC.

---

## Full Skill Description

<!-- auto-moved from frontmatter `description:` field because it exceeded codex's 1024-character limit. The frontmatter now has a shortened summary. Full original preserved verbatim below. -->

Interactive skill for creating RFC (Request for Comments) documents as Markdown files. Use this skill whenever the user wants to create an RFC, write a technical proposal, draft a design document, create a technical spec, or write a feature proposal. Triggers include: 'RFC', 'rfc', 'request for comments', 'design doc', 'technical proposal', 'feature proposal', 'tech spec', 'architecture proposal', 'engineering proposal', or any request to document a technical decision with sections like motivation, design, alternatives, and drawbacks. This skill guides the user through an interactive interview process, asking questions step by step, and then generates a polished RFC Markdown file. Use this even if the user just says 'I want to propose a new feature' or 'I need to document a technical decision' — these are RFCs in disguise. También se activa en castellano: "RFC", "propuesta técnica", "documento de diseño", "especificación técnica", "propuesta de arquitectura", "propuesta de ingeniería", "crear un RFC", "escribir un RFC", "proponer una feature", "documentar una decisión técnica", "propuesta de feature", "diseño técnico", "quiero proponer un cambio técnico", "necesito documentar una decisión".
