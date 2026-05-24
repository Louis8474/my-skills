---
title: Pluggable Flows
description: Understanding the specs.md flow architecture
---

## Framework Architecture

specs.md is built as a **pluggable framework** where development methodologies are implemented as **flows**. Choose the flow that matches your project needs.

## What is a Flow?

A **flow** is a complete development methodology implementation that includes:

- **Agents** — Specialized AI agents that guide development
- **Artifacts** — Structured outputs for each phase
- **State Management** — Tracking progress and context
- **Standards** — Project guidelines and conventions

## Available Flows

| Flow | Checkpoints | Agents | Optimized For |
|------|-------------|--------|---------------|
| **Simple** | 3 (phase gates) | 1 | Spec generation only |
| **FIRE** | Adaptive | 3 | Adaptive execution, brownfield |
| **AI-DLC** | Comprehensive | 4 | Full traceability |

---

## Simple Flow

**Simple Flow** generates structured specs without execution tracking—perfect for quick feature planning.

| Aspect | Details |
|--------|---------|
| **Agent** | 1 (specsmd-agent) |
| **Output** | `requirements.md`, `design.md`, `tasks.md` |
| **Phases** | Requirements → Design → Tasks |
| **Best For** | Prototypes, MVPs, spec handoff |

---

## FIRE Flow

**FIRE (Fast Intent-Run Engineering)** is an Adaptive Spec-Driven Development flow. It right-sizes the rigor to complexity—design docs when needed, implementation plans otherwise.

| Aspect | Details |
|--------|---------|
| **Agents** | 3 (Orchestrator, Planner, Builder) |
| **Checkpoints** | Adaptive (based on complexity + config) |
| **Optimized For** | Adaptive execution, brownfield, monorepos |
| **Key Features** | Walkthrough generation, hierarchical standards |

---

## AI-DLC Flow

**AI-DLC (AI-Driven Development Lifecycle)** is the full methodology with DDD and comprehensive traceability.

| Aspect | Details |
|--------|---------|
| **Agents** | 4 (Master, Inception, Construction, Operations) |
| **Phases** | Inception → Construction → Operations |
| **Best For** | Teams, complex domains, regulated environments |
| **Key Features** | DDD integration, Mob rituals, full traceability |

### Bolt Types (AI-DLC)

| Type | Best For | Stages |
|------|----------|--------|
| **DDD Construction** | Complex domain logic | Model → Design → ADR → Code → Test |
| **Simple Construction** | UI, integrations | Plan → Implement → Test |

---

## Tool Integration

All flows integrate with AI coding tools:

| Tool | Integration Method |
|------|-------------------|
| **Claude Code** | Slash commands in `.claude/commands/` |
| **Cursor** | Rules in `.cursor/rules/` |
| **GitHub Copilot** | Agents in `.github/agents/` |
| **Google Antigravity** | Agents in `.agent/agents/` |
