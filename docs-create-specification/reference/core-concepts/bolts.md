---
title: Bolts
description: Time-boxed execution sessions for rapid implementation
---

## What is a Bolt?

A **Bolt** is a time-boxed execution session in AI-DLC, designed for rapid implementation. Unlike Sprints (weeks), Bolts are completed in **hours to days**. Each bolt encapsulates a well-defined scope of work scoped to a Unit.

## Bolt Characteristics

- **Rapid** — Hours to days, not weeks
- **Focused** — One story or small set of related stories
- **Stage-Gated** — Validated checkpoints prevent errors
- **Complete** — Produces working, tested code

## Bolt Types

| Type | Best For | Stages |
|------|----------|--------|
| **DDD Construction** | Complex business logic, domain modeling | Model → Design → ADR → Implement → Test |
| **Simple Construction** | UI, integrations, utilities | Plan → Implement → Test |

### Choosing a Bolt Type

**Use DDD Construction when:**
- Building complex domain logic with business rules
- Creating bounded contexts with rich domain models
- Implementing services that require domain expertise
- Working on core business functionality

**Use Simple Construction when:**
- Building frontend pages and components
- Creating simple CRUD endpoints
- Integrating with external APIs
- Writing utilities and helper modules

## DDD Construction Bolt

| Stage | Purpose |
|-------|---------|
| **1. Domain Model** | Identify aggregates, entities, value objects, domain events, ubiquitous language |
| **2. Technical Design** | Choose patterns, define interfaces, plan data structures and APIs |
| **3. ADR Analysis** | Document significant decisions: context, options, decision, rationale |
| **4. Implement** | Generate production code following standards and patterns |
| **5. Test** | Unit tests, integration tests, acceptance tests |

## Simple Construction Bolt

| Stage | Purpose |
|-------|---------|
| **1. Plan** | Review stories, list deliverables, identify dependencies, define acceptance criteria |
| **2. Implement** | Setup file structure, implement functionality, handle edge cases, add documentation |
| **3. Test** | Write unit tests, run test suite, verify acceptance criteria, document results |

## Human Checkpoints

> Human validation happens at each checkpoint. You cannot proceed to the next stage without approval. This is the "Human Oversight as Loss Function" principle — catching errors early before they cascade.

### DDD Construction Checkpoints

```
Model → ✋ Approve → Design → ✋ Approve → ADR → ✋ Approve → Implement → ✋ Approve → Test → ✋ Approve
```

### Simple Construction Checkpoints

```
Plan → ✋ Approve → Implement → ✋ Approve → Test → ✋ Approve
```

## Executing Bolts

Start a bolt with the Construction Agent:

```
/specsmd-construction-agent --unit="my-unit"
```

The agent will:
1. Show available bolts for the unit
2. Ask which bolt to work on
3. Guide you through each stage
4. Generate artifacts at each step
5. Wait for your approval at gates
6. Record progress in the Memory Bank

## Bolt Artifacts

Each bolt produces artifacts stored in the Memory Bank:

### DDD Construction
```
memory-bank/bolts/{bolt-id}/
├── bolt.md                    # Bolt metadata and state
├── ddd-01-domain-model.md     # Domain model
├── ddd-02-technical-design.md # Technical design
├── adr-*.md                   # Architecture Decision Records (optional)
└── ddd-03-test-report.md      # Test results
```

### Simple Construction
```
memory-bank/bolts/{bolt-id}/
├── bolt.md                    # Bolt metadata and state
├── implementation-plan.md     # Plan from Stage 1
├── implementation-walkthrough.md # Developer notes from Stage 2
└── test-walkthrough.md        # Test results from Stage 3
```

## Bolt Commands

| Command | Purpose |
|---------|---------|
| `bolt-list` | List all bolts in unit |
| `bolt-start` | Start or continue a bolt |
| `bolt-status` | Check current progress |
| `bolt-replan` | Replan if scope changed |

## Best Practices

- **Keep Bolts Small** — A bolt should complete in hours to a few days. If it's taking longer, split it.
- **Choose the Right Bolt Type** — Use DDD for complex domain logic, Simple for UI/utilities. Don't over-engineer.
- **Don't Skip Stages** — Each stage builds on the previous. Skipping creates technical debt.
- **Validate Thoroughly** — Use gate reviews to catch issues early. It's cheaper to fix problems in design than in code.
- **Document Decisions** — ADRs capture the "why" behind decisions. Future you will thank present you.
