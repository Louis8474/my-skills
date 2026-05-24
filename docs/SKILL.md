---
name: docs
description: Guide users through a structured workflow for co-authoring pristine, standardized documentation (READMEs, proposals, specs). Focuses on clarity, formatting, and reader comprehension. Trigger when user mentions writing docs, creating proposals, drafting specs, or similar documentation tasks.
---

# Documentation Engineering

## When to use
Invoke this skill to document code, write project READMEs, generate API specs, create user manuals, or co-author decision docs/proposals. This skill uses a strict, interactive co-authoring workflow to ensure the document works well when others read it.

## Progressive Disclosure Rules
- Only load reference files if the user specifies a particular documentation framework (e.g., JSDoc, Docusaurus).

## Standard Operating Procedure (SOP): Doc Co-Authoring Workflow

Always act as an active guide, explicitly walking the user through the following three phases sequentially. Do not rush to draft the entire document at once.

### Phase 1: Context Gathering (Intent & Scoping)
**Goal:** Close the gap between what the user knows and what Claude knows, enabling smart guidance.

1. **Initial Questions:** Ask the user:
   - What type of document is this?
   - Who is the primary audience?
   - What is the desired impact when someone reads this?
   - Is there a template or specific format to follow?
2. **Info Dumping:** Encourage the user to dump all context (e.g., background, related discussions, technical architecture). Read shared links if integrations permit.
3. **Clarification:** Generate 5-10 numbered questions based on gaps in the context.
4. **Exit Condition:** Proceed only when you can ask about edge cases and trade-offs without needing the basics explained.

### Phase 2: Refinement & Structure (Iterative Drafting)
**Goal:** Build the document section by section through brainstorming, curation, and iterative refinement.

1. **Scaffolding:** Suggest 3-5 sections appropriate for the doc type. Once agreed, create the initial document structure with placeholder text for all sections.
2. **For Each Section (Chronologically):**
   - **Step 1 (Questions):** Ask 5-10 clarifying questions about what should be included in *this specific section*.
   - **Step 2 (Brainstorming):** Brainstorm 5-20 specific things that might be included.
   - **Step 3 (Curation):** Ask the user which numbered points to keep, remove, or combine.
   - **Step 4 (Gap Check):** Ask if anything important is missing based on their selections.
   - **Step 5 (SOP Drafting):** Draft the section based on their exact selections. 
     - *Standards:* Use active voice. Keep paragraphs short. All code blocks must specify a language. Use a logical header structure (H1, H2, H3).
   - **Step 6 (Refining):** Iteratively refine using surgical edits based on user feedback.
3. **Completion Check:** Read the entire document for flow, consistency, and redundancy before moving to Phase 3.

### Phase 3: Reader Testing & Final Formatting
**Goal:** Test the document with a fresh instance (no context bleed) to verify it works for readers.

1. **Predict Questions:** Generate 5-10 questions that realistic readers would ask when discovering this document.
2. **Testing Protocol:** 
   - If sub-agents are available, invoke a sub-agent with *just* the document content and the questions to see if it can answer them correctly.
   - If sub-agents are not available, instruct the user to open a fresh Claude conversation and test the questions.
3. **Additional Checks:** Check for ambiguity, false assumptions, and internal contradictions.
4. **Final Deliverable:** If testing reveals flaws, loop back to Phase 2 for that specific section. Otherwise, format the final approved document in Markdown or JSDoc comments.

## Interaction Guidelines
- Be direct and procedural. Do not "sell" the approach—just execute the phases.
- If the user wants to skip a stage, ask if they prefer to skip the SOP and write freeform.
- Use explicit file editing operations (like `str_replace`) for changes. Never reprint the whole document for a one-line edit.
