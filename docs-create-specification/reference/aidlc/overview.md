---
title: AI-DLC Flow Overview
description: Full AI-Driven Development Lifecycle with comprehensive traceability
---

## What is AI-DLC?

**AI-DLC (AI-Driven Development Lifecycle)** is a complete methodology for AI-native software development. It provides comprehensive traceability, DDD integration, and structured phases for complex projects.

> **AI proposes, human validates.** Like Google Maps—humans set the destination, AI provides step-by-step directions, humans maintain oversight at every checkpoint.

## Key Differentiators

- **Complete Methodology** — Full SDLC with defined phases, rituals, and artifacts
- **DDD Integration** — Domain-Driven Design is core, not optional
- **Comprehensive Checkpoints** — 10-26 human validation points per bolt
- **Four Specialized Agents** — Master, Inception, Construction, and Operations
- **Walkthrough Generation** — Every change documented automatically

## AI-DLC vs Other Flows

| Aspect | AI-DLC | FIRE | Simple |
|--------|--------|------|--------|
| **Philosophy** | Full methodology | Adaptive execution | Spec generation |
| **Hierarchy** | Intent → Unit → Story → Bolt → Stages | Intent → Work Item → Run | Feature → Phases |
| **Checkpoints** | Comprehensive (10-26 per bolt) | Adaptive (0-2) | 3 phase gates |
| **Agents** | 4 specialized agents | 3 agents | 1 agent |
| **Artifacts** | `memory-bank/` | `.specs-fire/` | `specs/` |
| **Optimized For** | Full traceability, complex domains | Teams who hate friction | Quick prototypes |

## When to Use AI-DLC

- You need comprehensive traceability (regulated environments, audits)
- You're building complex domain logic requiring DDD modeling
- You have multi-team coordination with explicit handoffs
- You want predictable, fixed checkpoints

## When to Consider Other Flows

- **Consider FIRE if:** You want adaptive checkpoints, working on brownfield projects, or have a monorepo
- **Consider Simple if:** You just need specs without execution tracking, prototyping, or want minimal overhead

## Three Phases

| Phase | Agent | Output |
|-------|-------|--------|
| **Inception** | Inception Agent | Intents, Units, Stories, Bolt Plans |
| **Construction** | Construction Agent | Domain Models, Code, Tests |
| **Operations** | Operations Agent | Deployments, Monitoring |

## Core Concepts

### Intent
A high-level business objective. The starting point for all work.

### Unit
A loosely-coupled module that can be developed independently.

### Story
A user story within a unit, with acceptance criteria.

### Bolt
A time-boxed execution cycle (hours or days) that implements stories through validated stages.

## Four-Agent Architecture

| Agent | Phase | Responsibility |
|-------|-------|----------------|
| **Master** | All | Orchestrates flow, routes requests, maintains awareness |
| **Inception** | Inception | Captures intents, elaborates requirements, plans bolts |
| **Construction** | Construction | Executes bolts through DDD stages |
| **Operations** | Operations | Builds, deploys, verifies, monitors |

## Project Structure

```
memory-bank/                   # AI-DLC artifacts
├── intents/                   # Captured intents
│   └── {intent-id}/
│       ├── requirements.md
│       ├── system-context.md
│       └── units/
│           └── {unit-id}/
│               ├── unit-brief.md
│               └── stories/
├── bolts/                     # Bolt execution records
├── standards/                 # Project standards
│   ├── tech-stack.md
│   ├── coding-standards.md
│   ├── system-architecture.md
│   └── ...
└── operations/                # Deployment context
```
