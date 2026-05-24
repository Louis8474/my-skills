---
title: The AI-Native SDLC Reimagined
description: Why the Agentic Age demands a new methodology
---

## Three Eras of AI in Development

| Era | Human Role | AI Role | Paradigm |
|-----|------------|---------|----------|
| **AI-Assisted** (2020-2023) | Primary creator | Autocomplete, suggestions | Human drives, AI helps |
| **AI-Driven** (2023-2025) | Validator, decision-maker | Generates code, plans, tests | AI proposes, human approves |
| **Agentic** (2025+) | Supervisor, architect | Autonomous multi-step execution | AI executes, human oversees |

## Why Traditional Sprints Don't Work

- **Two weeks is no longer fast** — AI-enabled development produces working prototypes in hours
- **The cost of code has collapsed** — Code generation costs minutes, not days
- **Estimation becomes meaningless** — Story points and velocity bear no relation to AI execution time

## The V-Bounce Model

The V-Bounce research introduced a foundational insight: **The role of humans shifts from primary implementers to validators and verifiers.**

| Aspect | Traditional V-Model | V-Bounce |
|--------|---------------------|----------|
| **Implementation** | Substantial (weeks/months) | Drastically reduced (hours/days) |
| **Human Role** | Hands-on coding | Validation and verification |
| **Emphasis** | Code production | Requirements + Architecture + Continuous validation |
| **AI Role** | None/minimal | End-to-end: planning → code → tests → maintenance |

### Empirical Results

- **55.8%** faster task completion with AI tools (GitHub Copilot study)
- **70%+** efficiency in generating test suites with AI
- Enhanced early bug detection and overall software quality

## The Reversed Conversation

In traditional development, humans prompt AI. In AI-DLC, **AI drives the conversation**:

```
AI: "I've analyzed your intent. Here are 3 Units I propose,
     with 12 user stories. I have 5 clarifying questions
     before we proceed."
Human: [validates, approves, or redirects]
```

Like Google Maps: humans set the destination, AI provides step-by-step directions, humans maintain oversight.

## Mob Rituals

- **Mob Elaboration (Inception)** — Product managers, developers, QA collaborate with AI. AI proposes breakdown into Units and Stories. Team validates in single room with shared screen.
- **Mob Construction (Construction)** — Teams work in parallel after domain modeling. AI generates component models, sequence diagrams, functional flows. Team provides real-time clarification.

## Bolts Replace Sprints

| Sprints | Bolts |
|---------|-------|
| 2-4 weeks | Hours or days |
| Fixed timeboxes | Flexible, intent-driven |
| Velocity measured | Business value measured |
| Story points estimated | AI executes, humans validate |

## Further Reading

- [AI-DLC Whitepaper (AWS)](https://github.com/fabriqaai/specsmd/blob/main/resources/aidlc.pdf)
- [V-Bounce Paper (arXiv)](https://arxiv.org/abs/2408.03416)
- [AWS Blog: AI-DLC](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/)
