---
title: Agents Overview
description: Four specialized agents that guide the AI-DLC development lifecycle
---

## The Agent System

specs.md provides four specialized agents that guide you through the entire development lifecycle. Each agent has focused responsibility and specific commands.

## Agent Responsibilities

| Agent | Responsibility |
|-------|----------------|
| **Master Agent** | Orchestrates the overall flow, routes requests, maintains project awareness |
| **Inception Agent** | Captures intents, elaborates requirements, decomposes into units |
| **Construction Agent** | Executes bolts, builds code, runs tests through validated stages |
| **Operations Agent** | Deploys, verifies, and monitors systems in production (alpha) |

## Invoking Agents

> These are prompts you type in your AI coding tool's chat interface (Claude Code, Cursor, Copilot, etc.), NOT command-line commands.

| Tool | Syntax |
|------|--------|
| **Claude Code** | `/specsmd-master-agent`, `/specsmd-inception-agent`, `/specsmd-construction-agent`, `/specsmd-operations-agent` |
| **Cursor** | `/specsmd-master-agent` or `@specsmd-master-agent` (same pattern for others) |
| **GitHub Copilot** | `/specsmd-master-agent` (same pattern for others) |

## Agent Session Lifecycle

Each agent session follows a pattern:

1. **Context Loading** — Agent reads relevant artifacts from Memory Bank
2. **Command Execution** — Agent performs the requested command
3. **Human Validation** — Agent pauses for approval at checkpoints
4. **Artifact Storage** — Agent writes results back to Memory Bank

> Each agent invocation starts fresh. Agents read context from the Memory Bank at startup. Ensure artifacts are saved after each step.

## Command Reference

### Master Agent

| Command | Purpose |
|---------|---------|
| `project-init` | Initialize project with standards |
| `analyze-context` | View current project state |
| `route-request` | Get directed to the right agent |
| `explain-flow` | Learn about AI-DLC methodology |
| `answer-question` | Get help with any specs.md question |

### Inception Agent

| Command | Purpose |
|---------|---------|
| `intent-create` | Create a new intent |
| `intent-list` | List all intents |
| `requirements` | Elaborate intent requirements |
| `context` | Define system context |
| `units` | Decompose into units |
| `story-create` | Create stories for a unit |
| `bolt-plan` | Plan bolts for stories |
| `review` | Review inception artifacts |

### Construction Agent

| Command | Purpose |
|---------|---------|
| `bolt-start` | Start/continue executing a bolt |
| `bolt-status` | Check bolt progress |
| `bolt-list` | List all bolts |
| `bolt-replan` | Replan bolts if needed |

### Operations Agent

| Command | Purpose |
|---------|---------|
| `build` | Build the project |
| `deploy` | Deploy to environment |
| `verify` | Verify deployment |
| `monitor` | Set up monitoring |

## Routing Between Agents

The Master Agent can route you to the appropriate agent:

```
> I want to add a new feature

Master Agent: That sounds like a new Intent. Let me route you 
to the Inception Agent.

/specsmd-inception-agent intent-create
```

## Best Practices

- **Start with Master** — When unsure where to begin, start with the Master Agent. It will guide you to the right place.
- **Complete Artifacts** — Finish and save artifacts before switching agents. Context is loaded from Memory Bank.
- **Follow the Flow** — Inception → Construction → Operations. Don't skip phases.
- **Use Commands** — Each agent has specific commands. Use them rather than free-form requests.

---

## Quick Start

### Prerequisites

- Node.js 18+ installed
- An AI coding tool (Claude Code, Cursor, GitHub Copilot, etc.)
- A project to work on (greenfield recommended for AI-DLC)

### Installation

```bash
npx specsmd@latest install
```

Select **AI-DLC** when prompted for the development flow.

### Initialize Your Project

Open your AI coding tool and start the Master Agent:

```
/specsmd-master-agent
```

Then type:

```
project-init
```

This guides you through establishing: Tech Stack, Coding Standards, System Architecture, UX Guide (optional), API Conventions (optional).

### Create Your First Intent

An **Intent** is your high-level goal:

```
/specsmd-inception-agent intent-create
```

The agent will:
1. Ask clarifying questions to minimize ambiguity
2. Elaborate into user stories and NFRs
3. Define system context
4. Decompose into loosely-coupled units

### Plan and Execute Bolts

```
# Plan bolts for your stories
/specsmd-inception-agent bolt-plan

# Execute a bolt
/specsmd-construction-agent bolt-start
```

Each bolt goes through validated stages:

| Stage | Purpose |
|-------|---------|
| **1. Domain Model** | Model business logic using DDD principles |
| **2. Technical Design** | Apply patterns and make architecture decisions |
| **3. ADR Analysis** | Document significant decisions (optional) |
| **4. Implement** | Generate production code |
| **5. Test** | Verify correctness with automated tests |

> Human validation happens at each checkpoint. This ensures errors are caught early before cascading downstream.

### Troubleshooting

- **Agent doesn't remember context** — Agents are stateless—they read artifacts from Memory Bank at startup. Ensure artifacts are saved after each step.
- **Bolt stuck in stage** — Run `bolt-status` to check current stage. If validation failed, address the feedback and continue with `bolt-start`.
- **Want to restart a bolt** — Bolts can be replanned with `bolt-replan`.
- **Multiple intents exist** — Run `/specsmd-master-agent analyze-context` to see all intents and their status.
