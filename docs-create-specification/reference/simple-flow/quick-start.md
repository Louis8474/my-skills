---
title: Quick Start
description: Get started with Simple Flow in minutes
---

## Prerequisites

- Node.js 18+ installed
- An AI coding tool (Claude Code, Cursor, GitHub Copilot, etc.)
- A feature idea to spec out

## Installation

```bash
npx specsmd@latest install
```

Select **Simple** when prompted for the development flow.

The installer will:
1. Detect available agentic coding tools
2. Install the spec agent and skills
3. Set up slash commands for your tools

## Invoking the Agent

> These are prompts you type in your AI coding tool's chat interface, NOT command-line commands.

| Tool | Syntax |
|------|--------|
| **Claude Code** | `/specsmd-agent` |
| **Cursor** | `/specsmd-agent` or `@specsmd-agent` |
| **GitHub Copilot** | `@specsmd-agent` |

## Agent Capabilities

The Simple Flow agent handles:

- **Spec Creation** — Generate requirements, design, and task documents from a feature idea
- **Phase Navigation** — Move through Requirements → Design → Tasks with explicit approval gates
- **Task Execution** — Execute implementation tasks one at a time with review
- **Context Loading** — Resume work on existing specs by reading saved documents

## Your First Spec

### Step 1: Create a New Spec

Invoke the agent with your feature idea:

```
/specsmd-agent Create a todo app with local storage
```

The agent will:
1. Derive a feature name (`todo-app`)
2. Generate a requirements document
3. Ask for your approval

### Step 2: Review Requirements

The agent generates requirements using EARS format:

```markdown
# Requirements Document

## Introduction
A simple todo application that allows users to manage their daily tasks...

## Glossary
- **Todo_System**: The complete todo application
- **Task**: A single todo item with description and completion status

## Requirements

### Requirement 1
**User Story:** As a user, I want to add new tasks...

#### Acceptance Criteria
1. WHEN user types a task and presses Enter, THE Todo_System SHALL create a new task
2. WHEN user attempts to add empty task, THE Todo_System SHALL prevent addition
```

**To approve:** Say "yes", "approved", or "looks good"

**To revise:** Provide specific feedback

### Step 3: Review Design

After approval, the agent generates a technical design with architecture, components, and data models.

### Step 4: Review Tasks

After design approval, the agent generates an implementation plan with numbered tasks and checkpoint tasks.

### Step 5: Execute Tasks

Once tasks are approved:

```
/specsmd-agent What's the next task?
```

The agent executes one task, then waits for your review.

---

## Commands Reference

| Action | Command |
|--------|---------|
| Create new spec | `/specsmd-agent Create a [feature idea]` |
| Continue existing | `/specsmd-agent` |
| Resume specific spec | `/specsmd-agent --spec="todo-app"` |
| Ask what's next | `/specsmd-agent What's the next task?` |
| Execute specific task | `/specsmd-agent Execute task 2.1` |

## File Structure

After installation:

```
.specsmd/
├── manifest.yaml              # Installation manifest
└── simple/                    # Simple flow resources
    ├── agents/agent.md        # Agent definition
    ├── skills/                # Agent skills
    ├── templates/             # Document templates
    └── memory-bank.yaml       # Storage schema

specs/                         # Your feature specs
└── todo-app/
    ├── requirements.md
    ├── design.md
    └── tasks.md
```

## Agent Session Lifecycle

1. **Context Loading** — Agent reads existing spec files from `specs/{feature-name}/`
2. **Phase Detection** — Agent determines current phase based on which files exist
3. **Generation or Execution** — Agent generates the next document or executes the next task
4. **Approval Gate** — Agent waits for explicit approval before proceeding

> The agent is stateless. It reads spec files at startup. Ensure documents are saved after each step.

---

## Tips for Success

- **Be specific with your feature idea**
  - Good: "User auth with email/password and session management"
  - Too vague: "Login feature"

- **Review checkpoints** — Checkpoint tasks run the test suite. Don't skip them.

- **One task at a time (default)** — The agent pauses after each task for review. If you're happy with progress, tell it to keep going (e.g., "continue until done", "go yolo").

## Troubleshooting

- **Agent doesn't remember context** — The agent is stateless—it reads spec files at startup. Ensure documents are saved after each step.

- **Multiple specs exist** — Run `/specsmd-agent` without arguments to see all specs and choose which to work on.

- **Want to start over** — Delete the spec folder: `rm -rf specs/{feature-name}`

- **Input too vague** — If your feature idea is too vague, the agent will ask a clarifying question before generating. Provide more specific details.
