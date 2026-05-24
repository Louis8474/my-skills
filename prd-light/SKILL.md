---
name: prd-light
description: >
  Generate lightweight Product Requirements Documents through a fast, 5-phase guided conversation.
  Use this skill for MVPs, internal tools, small-to-medium features, or early-stage ideas that need
  structure but not ceremony. Trigger when the user mentions "PRD light", "light PRD", "quick PRD",
  "lightweight PRD", "simple PRD", "mini PRD", "short PRD", "brief PRD", "MVP requirements",
  "MVP spec", "quick requirements", "rough PRD", or asks to "document what we need to build quickly".
  También se activa en castellano: "PRD ligero", "PRD rápido", "PRD simple", "PRD corto",
  "mini PRD", "requerimientos ligeros", "requerimientos rápidos", "especificación rápida",
  "especificación simple", "PRD MVP", "requerimientos del MVP",
  "documento de requerimientos simple", "PRD breve".
license: MIT
metadata:
  author: andresnator
  version: "1.0.0"
---

# PRD Light — Fast Interactive Builder

Build structured-enough Product Requirements Documents for features, MVPs, and internal tools
through a quick 5-phase guided conversation. Same interactive philosophy as the full PRD —
one phase at a time, validate, challenge — but tuned for speed.

## When to Use PRD Light vs Full PRD

**Use PRD Light when:**
- Building an MVP, internal tool, or small-to-medium feature
- You need alignment on what to build, not a compliance artifact
- The team is small and context is mostly shared already

**Use Full PRD (`prd`) when:**
- The product requires cross-team coordination
- There are compliance, security, or regulatory requirements that need formal documentation
- The system has complex API surfaces that need contract definitions
- Multiple stakeholders need to sign off on detailed specs

## Template

The PRD Light template lives in: `references/prd-light-template.md`

Read this template at the START of every PRD Light session. It defines the structure and fields
for the final document.

## Interactive Flow

### How the Conversation Works

1. **One phase at a time** — present the current phase, explain what it needs, ask the user.
   Never dump all phases at once.

2. **Validate before advancing** — review the user's input for:
   - **Completeness**: Are the essential fields covered?
   - **Specificity**: Are requirements concrete enough to act on?

3. **Challenge once** — if something is vague or missing, push back with a specific suggestion.
   One follow-up per item max — this is light mode, not an interrogation.

4. **Allow easy skips** — if a subsection isn't relevant, the user can say "not applicable"
   without justification. Push back only if they're skipping something clearly important.

5. **Summarize after each phase** — brief recap of what was captured before moving on.

### Phase Sequence

Walk through these 5 phases in order. Each maps to a section in the template.

#### Phase 1: Context & Goals
**Goal**: Establish the what, why, and how we'll know it worked.
**Ask about**:
- Product/feature name
- Problem statement — who has this problem, how severe, current workarounds
- Vision — one sentence describing the ideal end state
- Scope — what's in and what's explicitly out
- Success criteria — 2-4 goals with measurable targets

**Validate**: Problem statement names a real user pain point. Scope has at least one out-of-scope
item. Success criteria are measurable — "improve performance" is not acceptable, but a one-liner
target is fine (no need for baseline + measurement method + timeline).

#### Phase 2: Users & Requirements
**Goal**: Understand who uses this and what they need.
**Ask about**:
- Target users — 1-2 sentences per user type (role, technical level, main pain point)
- Key scenarios — what the user does, step by step, in plain language
- Requirements — each with ID, description, priority (Must/Should/Could), acceptance criteria

**Validate**: Each requirement has acceptance criteria. Plain-language criteria are fine — no need
for formal Given/When/Then. If >70% of requirements are Must-have, challenge the user to
reprioritize. Formal persona cards are NOT required.

#### Phase 3: Technical Approach
**Goal**: Establish how this will be built.
**Ask about**:
- Architecture overview — high-level description (diagram optional)
- Key technical decisions with rationale
- Quality constraints — only what matters for this feature (performance, availability, data handling)
- Dependencies — internal and external, with impact if unavailable

**Validate**: Approach should be consistent with requirements from Phase 2. Flag obvious
mismatches (e.g., high-availability need with a single point of failure). Component ownership
tables, formal data models, and API contracts are NOT required — if the feature has an API surface,
mention it here but don't formalize it.

#### Phase 4: Risks & Open Questions
**Goal**: Surface what could go wrong and what's still uncertain.
**Ask about**:
- Risks — what could derail this, with impact and mitigation
- Open questions — unresolved items with owner and due date
- Assumptions — what the PRD takes for granted, and what breaks if wrong

**Validate**: Push back if zero risks or zero open questions — there are always some. A simple
risk + mitigation pair is enough — no need for probability/impact/owner matrices.

#### Phase 5: Delivery Plan
**Goal**: Define what ships when.
**Ask about**:
- Milestones with deliverables and target dates
- MVP definition — what's the smallest useful thing that ships first?

**Validate**: Must-have requirements from Phase 2 should appear in the MVP or earliest milestone.
Challenge timelines with zero buffer. Release strategy, rollback plans, and feature flag details
are NOT required.

## Document Generation

After all phases are complete (or explicitly skipped):

1. Read `references/prd-light-template.md` to ensure the structure is current
2. Compile all validated content into the template structure
3. Fill metadata: product name, version, author, date, status (Draft)
4. Replace all `{placeholder}` fields with collected content
5. Mark skipped sections as "N/A"
6. Present the complete document to the user for final review

Ask the user where to save the file. Default: `PRD-Light-{product-name}-v{version}.md`

## Resuming a PRD Light Session

If the user wants to continue a PRD Light started earlier:
1. Ask for the existing file path
2. Read it and identify which phases are complete vs. placeholder
3. Summarize what's done and pick up from the first incomplete phase

## Upgrading to Full PRD

If mid-conversation the user realizes they need more rigor (API contracts, security/compliance
sections, detailed NFRs), suggest upgrading:

1. Export what's been captured so far as a partial PRD Light document
2. Recommend switching to the full `prd` skill
3. The full PRD can pick up from what's already documented — the user won't lose work
