---
name: prd
description: "Generate technical Product Requirements Documents (PRD) through an interactive, phase-by-phase guided process."
license: "MIT"
metadata:
  author: andresnator
  version: 1.0.0
---

# Technical PRD — Interactive Builder

Build complete, high-quality Product Requirements Documents through a guided, phase-by-phase
conversation. Each phase collects information, validates it for completeness and clarity, and
only moves forward when the section meets quality standards.

## Why This Approach

A PRD is only as good as the thinking behind it. Dumping a blank template on someone produces
shallow, checkbox-filling answers. By walking through each phase interactively — asking probing
questions, challenging vague statements, and validating as we go — the result is a PRD that
actually serves its purpose: aligning teams on what to build and why.

## Template

The full PRD template with all sections and field descriptions lives in:
`references/prd-template.md`

Read this template at the START of every PRD session. It defines the structure, fields, and
expected content for each section. Use it as the skeleton for the final document.

## Interactive Flow

### How the Conversation Works

1. **One phase at a time** — present the current phase, explain what it needs, and ask the user
   to provide the information. Never dump all phases at once.

2. **Validate before advancing** — after the user provides content for a phase, review it against
   these quality criteria before moving to the next phase:
   - **Completeness**: Are all required fields filled? Are there obvious gaps?
   - **Specificity**: Are requirements measurable and concrete, not vague?
   - **Consistency**: Does this phase contradict anything from previous phases?
   - **Feasibility**: Are there any red flags (unrealistic targets, missing dependencies)?

3. **Challenge respectfully** — if something is vague, incomplete, or potentially problematic,
   say so with a specific suggestion. Examples:
   - Vague: "The system should be fast" → Ask: "What does fast mean here? Can you define a
     target like p95 < 200ms?"
   - Missing: No error handling in use cases → Ask: "What happens when X fails? Should we
     define the error path?"
   - Risky: Aggressive timeline with many dependencies → Flag: "Phase 1 depends on 3 external
     teams. What's the fallback if one blocks?"

4. **Allow skipping** — if a phase is genuinely not applicable (e.g., no API for an internal
   CLI tool), let the user mark it as N/A with a brief justification. But push back if they're
   skipping something important.

5. **Summarize after each phase** — after validating and accepting a phase, show a brief summary
   of what was captured so the user can confirm before moving on.

### Phase Sequence

Walk through these phases in order. Each phase maps to a section in the template.

#### Phase 1: Product Overview
**Goal**: Establish the what and why.
**Ask about**:
- Product/feature name and version
- Problem statement — who has this problem, how severe, current workarounds
- Vision — the ideal end state in one paragraph
- Scope — what's in and what's explicitly out

**Validate**: Problem statement must identify a real user pain point, not just a technical desire.
Scope must have both in-scope AND out-of-scope items (out-of-scope prevents scope creep later).

#### Phase 2: Goals & Success Metrics
**Goal**: Define measurable outcomes.
**Ask about**:
- 2-5 concrete goals categorized as Business, Technical, or User Experience
- Success metrics with: current baseline, target, measurement method, timeline
- Explicit non-goals

**Validate**: Every goal must have at least one corresponding metric. Metrics must be measurable
(not "improve performance" but "reduce p95 latency from 800ms to 200ms within 3 months").
Challenge metrics without baselines — you can't measure improvement without knowing the starting point.

#### Phase 3: User Personas & Use Cases
**Goal**: Understand who uses this and how.
**Ask about**:
- 1-3 primary personas with role, technical level, pain points, goals
- Key use cases with actor, precondition, trigger, main flow, postcondition
- Alternative/error flows for critical use cases

**Validate**: Personas should be specific enough to make design decisions against (not "a user"
but "a junior developer deploying for the first time"). Use cases must have concrete steps, not
abstract descriptions.

#### Phase 4: Functional Requirements
**Goal**: Define what the system must do.
**Ask about**:
- Requirements with ID, description, priority (Must/Should/Could), acceptance criteria
- User stories organized by epic if applicable
- Acceptance criteria in Given/When/Then format

**Validate**: Each requirement needs acceptance criteria — without them, there's no way to verify
implementation. Priorities should follow MoSCoW and not everything can be "Must". If >70% are
Must-have, challenge the user to reprioritize.

#### Phase 5: Non-Functional Requirements
**Goal**: Define quality attributes.
**Ask about**:
- Performance: response time, throughput, resource limits
- Scalability: horizontal/vertical strategy, data growth
- Reliability: uptime target, RTO, RPO, failure modes
- Observability: logging, metrics, alerting, tracing

**Validate**: NFRs must have numbers, not adjectives. "Highly available" is not a requirement;
"99.9% uptime measured monthly" is. Ask about observability early — it's often forgotten and
expensive to bolt on later.

#### Phase 6: System Architecture
**Goal**: Establish the high-level technical design.
**Ask about**:
- Architecture overview (describe it; a diagram reference is fine too)
- Component breakdown with responsibilities, tech stack, owners
- Data model — key entities and relationships
- Data flow for primary use cases

**Validate**: Architecture should address the NFRs from Phase 5. If the user claims 99.9% uptime
but the architecture has a single point of failure, flag it. Components need clear ownership.

#### Phase 7: API & Interface Contracts
**Goal**: Define how components and users interact with the system.
**Ask about**:
- API endpoints with method, path, description, auth requirements
- Request/response schemas for key endpoints
- Error codes and what clients should do about them

**Validate**: APIs should be consistent (naming conventions, error format). If the system has both
internal and external APIs, security boundaries should be clear. Skip this phase if the product
has no API surface (CLI tools, batch processes, etc.).

#### Phase 8: Dependencies & Integrations
**Goal**: Map what the system depends on and what depends on it.
**Ask about**:
- Internal dependencies: services, libraries, shared infrastructure
- External dependencies: third-party APIs, SaaS tools, cloud services
- For each: impact if unavailable, SLA expectations, fallback strategy
- Migration requirements if replacing an existing system

**Validate**: Every external dependency needs a fallback strategy. "It won't go down" is not
acceptable — ask what happens when it does. Internal dependencies need identified owners.

#### Phase 9: Security & Compliance
**Goal**: Define security posture and regulatory needs.
**Ask about**:
- Authentication method and authorization model
- Roles and permissions matrix
- Data classification and encryption (at rest, in transit)
- PII handling and data retention
- Compliance requirements (GDPR, SOC2, HIPAA, etc.)

**Validate**: If the system handles PII, there must be a data retention policy. Auth model should
match the use cases from Phase 3. If compliance is required, each regulation needs a specific
implementation plan, not just a checkbox.

#### Phase 10: Risks & Mitigations
**Goal**: Identify what could go wrong and how to handle it.
**Ask about**:
- Technical risks: scalability limits, single points of failure, tech debt
- Organizational risks: team capacity, knowledge gaps, dependencies on key people
- External risks: vendor lock-in, regulatory changes, market shifts
- For each: probability, impact, mitigation plan, owner

**Validate**: Risks should connect to earlier phases. If the architecture has a novel component
nobody has experience with, that's a risk. If the timeline is tight and 3 teams must coordinate,
that's a risk. Help the user see risks they might not have considered.

#### Phase 11: Timeline & Milestones
**Goal**: Define when things ship and how.
**Ask about**:
- Phases with deliverables, target dates, and dependencies
- Release strategy: rollout method, rollback plan, feature flags
- MVP definition — what's the smallest useful thing that can ship first?

**Validate**: Timeline must be consistent with Must-have requirements from Phase 4 — everything
marked Must should be in the earliest phase. Dependencies from Phase 8 should be reflected in
the timeline. Challenge timelines that don't include buffer for unknowns.

#### Phase 12: Open Questions & Assumptions
**Goal**: Capture what's still uncertain.
**Ask about**:
- Unresolved questions with owner and due date
- Assumptions the PRD is built on, with the risk if each is wrong
- Glossary of domain-specific terms used in the document

**Validate**: This phase is a quality check on the whole PRD. If the user has no open questions,
push back — there are always unknowns. Review earlier phases and surface anything that felt
uncertain. Every assumption should have a validation plan.

## Document Generation

After all phases are complete (or explicitly skipped with justification):

1. Read `references/prd-template.md` again to ensure the structure is current
2. Compile all validated content into the template structure
3. Fill metadata: product name, version, author, date, status (Draft)
4. Replace all `{placeholder}` fields with the collected content
5. Mark skipped sections as "N/A — {justification}"
6. Add a change log entry for the initial version
7. Present the complete document to the user for final review

Ask the user where they want the file saved. Default to the current working directory with the
naming convention: `PRD-{product-name}-v{version}.md`

## Resuming a PRD Session

If the user wants to continue a PRD they started earlier:
1. Ask them to provide the existing PRD file path
2. Read the file and identify which phases are complete vs. empty/placeholder
3. Summarize what's already done and pick up from the first incomplete phase
4. Follow the same validation flow for remaining phases

## Quick Mode → Use PRD Light

If the user says "quick PRD", "lightweight PRD", "simple PRD", or similar, redirect them to the
`prd-light` skill instead. PRD Light is a standalone skill with its own 5-phase structure and
lighter template, purpose-built for MVPs, internal tools, and small-to-medium features.

Say: "It sounds like PRD Light would be a better fit — it's a dedicated 5-phase flow designed
for speed. Want me to switch to that?"

---

## Full Skill Description

<!-- auto-moved from frontmatter `description:` field because it exceeded codex's 1024-character limit. The frontmatter now has a shortened summary. Full original preserved verbatim below. -->

Generate technical Product Requirements Documents (PRD) through an interactive, phase-by-phase guided process. Use this skill whenever the user wants to create a PRD, write product requirements, define a technical product spec, document a new feature or product from a requirements perspective, or needs help structuring what they want to build before starting development. Also trigger when the user mentions "product requirements", "PRD", "technical spec for a product", "feature spec", or asks to "document what we need to build". This skill validates each section as the user writes it and produces a complete PRD document at the end. También se activa en castellano: "PRD", "requerimientos de producto", "documento de requerimientos", "especificación de producto", "requisitos técnicos", "crear un PRD", "escribir un PRD", "definir requerimientos", "documentar producto", "requerimientos del producto", "especificación técnica del producto", "qué necesitamos construir", "requisitos del producto", "escribir requerimientos".
