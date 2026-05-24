---
title: AI-DLC vs Agile
description: How AI-DLC compares to traditional Agile methods
---

## Side-by-Side Comparison

| Aspect | Agile/Scrum | AI-DLC |
|--------|-------------|--------|
| **Iteration Duration** | Weeks (Sprints) | Hours/Days (Bolts) |
| **Who Drives** | Human-driven, AI assists | AI-driven, human-validated |
| **Design Techniques** | Out of scope | Integrated (DDD in construction bolts) |
| **Task Decomposition** | Manual | AI-powered |
| **Phases** | Repeating sprints | Rapid three-phase cycles |
| **Rituals** | Daily standups, retrospectives | Mob Elaboration, Mob Construction |
| **Documentation** | Often neglected | Built-in artifacts |
| **Context Engineering** | Lost between sprints | Specs + Memory Bank |

## Iteration: Sprints vs Bolts

### Agile Sprints
- **Duration**: 1-4 weeks
- **Planning**: Sprint planning ceremony
- **Execution**: Daily standups, continuous work
- **Review**: Sprint review, retrospective
- **Output**: Potentially shippable increment

### AI-DLC Bolts
- **Duration**: Hours to days
- **Planning**: AI-powered decomposition
- **Execution**: Stage-gated progression
- **Review**: Human validation at each checkpoint
- **Output**: Validated, tested feature

## Role Inversion

### Traditional Agile
Humans drive the entire process. AI tools (copilots, assistants) help with specific tasks but don't lead.

### AI-DLC
AI leads the conversation. Humans provide intent and validation. AI handles decomposition, planning, and execution.

> Human → Defines Intent → AI Proposes → Human Validates → AI Executes

## Bolt Types with Built-in Design

| Bolt Type | Best For | Stages |
|-----------|----------|--------|
| **DDD Construction** | Complex domain logic, business rules | Model → Design → ADR → Implement → Test |
| **Simple Construction** | UI, integrations, utilities | Plan → Implement → Test |

## Context Engineering

One of the biggest challenges in traditional Agile is context loss between sprints. Knowledge leaves with team members, decisions aren't documented, and the codebase becomes a mystery.

### AI-DLC Solution: Specs + Memory Bank

Specs and Memory Bank provide structured context for AI agents:

- All project artifacts (requirements, designs, decisions)
- Traceability between artifacts
- Context that agents can reload in any session

```
memory-bank/
├── intents/           # What we're building
├── bolts/             # How we built it
├── standards/         # Project decisions
└── operations/        # Deployment context
```

## When to Use Each

### Use Agile When
- Team is not using AI coding tools
- Organization has established Agile processes
- Regulatory requirements mandate specific ceremonies
- Team prefers human-led planning

### Use AI-DLC When
- Building with AI coding assistants
- Need rapid iteration cycles
- Want integrated design practices
- Building complex systems
- Context persistence is critical

## Migration Path

| Agile Concept | AI-DLC Equivalent |
|---------------|-------------------|
| Epic | Intent |
| User Story | Story (within Unit) |
| Sprint | Bolt |
| Backlog | Intent/Unit definitions |
| Definition of Done | Checkpoint validations |
