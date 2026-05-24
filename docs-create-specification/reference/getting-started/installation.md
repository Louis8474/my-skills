---
title: Installation
description: Install specs.md and select your development flow
---

## Prerequisites

- Node.js 18 or higher
- An AI coding tool (Claude Code, Cursor, GitHub Copilot, or Google Antigravity)

## Install specs.md

> Always use npx to get the latest version. Do not install globally with npm.

```bash
npx specsmd@latest install
```

## Select Your Flow

During installation, you'll be prompted to select a development flow:

```
? Select a development flow:
  Simple - Spec generation only (requirements, design, tasks)
  FIRE - Adaptive execution, brownfield & monorepo ready
  AI-DLC - Full methodology with DDD (comprehensive checkpoints)
```

## What Gets Installed

### Simple Flow

```
.specsmd/
├── manifest.yaml              # Installation manifest
└── simple/                    # Simple flow
    └── agents/                # Single agent

specs/                         # Your specs will go here
└── (feature folders)
```

### FIRE Flow

```
.specsmd/
├── manifest.yaml              # Installation manifest
└── fire/                      # FIRE flow
    ├── agents/                # Orchestrator, Planner, Builder
    └── skills/                # Agent capabilities

.specs-fire/                   # Project artifacts
├── state.yaml                 # Central state tracking
├── standards/                 # Project standards
├── intents/                   # Intent documentation
├── runs/                      # Run logs
└── walkthroughs/              # Generated documentation
```

### AI-DLC Flow

```
.specsmd/
├── manifest.yaml              # Installation manifest
└── aidlc/                     # AI-DLC flow
    ├── agents/                # Master, Inception, Construction, Operations
    ├── skills/                # Agent capabilities
    ├── templates/             # Artifact templates
    └── memory-bank.yaml       # Memory bank schema

memory-bank/                   # Project artifacts
├── standards/                 # Project standards
├── intents/                   # Intent documentation
└── bolts/                     # Bolt tracking
```

## Tool-Specific Commands

After installation, commands are available in your AI coding tool:

### Simple Flow
- `/specsmd-agent`

### FIRE Flow
- `/specsmd-fire`
- `/specsmd-fire-planner`
- `/specsmd-fire-builder`

### AI-DLC Flow
- `/specsmd-master-agent`
- `/specsmd-inception-agent`
- `/specsmd-construction-agent`
- `/specsmd-operations-agent`

Commands are installed as:
- **Claude Code**: Slash commands in `.claude/commands/`
- **Cursor**: Rules in `.cursor/commands/`
- **GitHub Copilot**: Agents in `.github/agents/`
- **Google Antigravity**: Workflows in `.agent/workflows/`
