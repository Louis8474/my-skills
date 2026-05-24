---
title: Simple Flow Overview
description: Lightweight spec-driven development for simpler projects
---

## What is Simple Flow?

Simple Flow is a lightweight spec-driven development workflow for projects that don't need the full complexity of AI-DLC. It guides you through three phases to transform a feature idea into an actionable implementation plan.

Think of it as: Kiro-style spec-driven development that works with any AI coding tool—Claude Code, Cursor, GitHub Copilot, and more.

## Three Phases

| Phase | Output | Purpose |
|-------|--------|---------|
| **Requirements** | `requirements.md` | Define what to build with user stories and EARS criteria |
| **Design** | `design.md` | Create technical design with architecture and Mermaid diagrams |
| **Tasks** | `tasks.md` | Generate implementation checklist with coding tasks |

One agent (`/specsmd-agent`) guides you through all phases.

## When to Use Simple Flow

**Simple Flow** — Spec generation only
- Building prototypes or MVPs
- Quick feature specs
- Handoff to other teams
- No execution tracking needed

**FIRE Flow** — Adaptive execution
- Teams who hate friction, brownfield projects, monorepos

**AI-DLC Flow** — Full methodology
- Multi-team coordination, complex domain logic (DDD), regulated environments

> **Independent Flows**: Flows are designed for different use cases—they're not an upgrade path. Choose based on your project needs.

## Flow Comparison

| Aspect | Simple | FIRE | AI-DLC |
|--------|--------|------|--------|
| **Optimized For** | Spec generation | Adaptive execution | Full traceability |
| **Checkpoints** | 3 (phase gates) | Adaptive | Comprehensive |
| **Agents** | 1 | 3 | 4 |
| **Execution Tracking** | No | Yes | Yes |
| **Phases** | Req → Design → Tasks | Plan → Execute | Inception → Construction → Operations |
| **Output** | `specs/` folder | `.specs-fire/` | `memory-bank/` |
| **Design Docs** | Basic | When needed | DDD or Simple bolt |
| **Overhead** | Minimal | Adaptive | Significant |

## Output Structure

Simple Flow creates a clean, flat structure:

```
specs/
└── {feature-name}/
    ├── requirements.md    # What to build
    ├── design.md          # How to build it
    └── tasks.md           # Step-by-step plan
```

No complex memory-bank hierarchy—just specs.

## Core Principles

### Generate First, Ask Later
The agent generates a draft document immediately based on your feature idea. This serves as a starting point for discussion rather than requiring extensive Q&A upfront.

### Explicit Approval Gates
You must explicitly approve each phase before proceeding. Say "yes", "approved", or "looks good" to continue. Any feedback triggers revision.

### One Phase at a Time
The agent focuses on one document per interaction. Complete each phase before moving to the next.

### One Task at a Time
During execution, only one task is implemented per interaction. This allows careful review of each change.
