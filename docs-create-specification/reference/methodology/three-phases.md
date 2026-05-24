---
title: The Three Phases
description: Deep dive into Inception, Construction, and Operations
---

## Overview

AI-DLC organizes development into three distinct phases, each with specialized agents and clear outputs.

## Phase 1: Inception

**Agent:** Inception Agent — Captures intents, elaborates requirements, and decomposes work.

### Purpose
Transform high-level goals into well-defined, implementable work items.

### Activities
1. **Intent Capture** — Gather the high-level goal
2. **Requirement Elaboration** — AI asks clarifying questions, generates user stories and NFRs
3. **System Context** — Define boundaries, interfaces, and constraints
4. **Unit Decomposition** — Break intent into loosely-coupled, independently developable units
5. **Bolt Planning** — Plan the bolts needed to implement each story

### Key Outputs

| Artifact | Description |
|----------|-------------|
| `requirements.md` | User stories, acceptance criteria, NFRs |
| `system-context.md` | Boundaries, interfaces, constraints |
| `units.md` | Unit definitions with dependencies |
| Bolt Plans | Ordered list of bolts per unit |

---

## Phase 2: Construction

**Agent:** Construction Agent — Executes bolts through validated stages, producing tested, production-ready code.

### Purpose
Transform specifications into working, tested code through disciplined stages.

### Bolt Stages

#### DDD Construction (for complex business logic and domain modeling)

| Stage | Purpose |
|-------|---------|
| **1. Domain Model** | Identify aggregates, entities, value objects, domain events, ubiquitous language |
| **2. Technical Design** | Choose patterns, define interfaces, plan data structures |
| **3. ADR Analysis** (Optional) | Document significant architectural decisions with context, options, rationale |
| **4. Implement** | Generate production code following standards and patterns |
| **5. Test** | Unit tests for domain logic, integration tests, acceptance tests |

#### Simple Construction (for UI, integrations, utilities)

| Stage | Purpose |
|-------|---------|
| **1. Plan** | Review requirements, list deliverables, identify dependencies, define acceptance criteria |
| **2. Implement** | Setup structure, implement functionality, handle edge cases, add documentation |
| **3. Test** | Write unit tests, run test suite, verify acceptance criteria, document results |

### Human Checkpoints

> Human validation happens at each checkpoint. The AI proposes, the human approves or requests changes. This prevents errors from cascading downstream.

### Bolt Types

| Type | Best For | Stages |
|------|----------|--------|
| **DDD Construction** | Complex domain logic, business rules | Model → Design → ADR → Code → Test |
| **Simple Construction** | UI, integrations, utilities | Plan → Implement → Test |

---

## Phase 3: Operations

**Agent:** Operations Agent — Deploys, verifies, and monitors the system in production.

### Purpose
Take constructed features to production and ensure they run reliably.

### Activities

| Stage | Description |
|-------|-------------|
| **Build** | Compile, bundle, and prepare deployment artifacts |
| **Deploy** | Deploy to target environment (staging, production) |
| **Verify** | Run smoke tests, health checks, and validation |
| **Monitor** | Set up logging, metrics, and alerting |

### Key Outputs

| Artifact | Description |
|----------|-------------|
| Deployment Units | Containerized or packaged applications |
| Runbooks | Operational procedures |
| Monitoring Config | Dashboards and alerts |

---

## Phase Transitions

### Inception → Construction
1. All units are defined with clear boundaries
2. Stories have acceptance criteria
3. Bolt plans are approved
4. Dependencies are mapped

### Construction → Operations
1. All bolts are completed and validated
2. Tests are passing
3. Code review is complete
4. Documentation is updated

## Master Agent Role

The Master Agent orchestrates across phases:

- **Routing**: Directs to the appropriate agent
- **Context**: Maintains awareness of project state
- **Guidance**: Helps navigate the methodology
- **Standards**: Enforces project conventions
