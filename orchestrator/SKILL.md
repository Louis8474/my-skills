---
name: orchestrator
description: The entry-point coordinator for complex multi-domain builds. Classifies user intent, selects appropriate domain skills, enforces phase gates, and manages the overall build workflow. Use this skill whenever a user's request spans multiple technical domains (e.g., "build a SaaS app") or when coordinating output from multiple other skills. Always route through orchestrator before executing any domain work.
---

# Orchestrator Skill

## Purpose
The orchestrator is the air traffic controller of the Supernova system. It exists to solve a specific problem: vibe-coders ask for outcomes ("I want a user login system") without understanding what that entails. The orchestrator's job is to translate that intent into an ordered, coordinated sequence of domain skill activations - and to act as a hard gate preventing execution until prerequisites are met.

## Progressive Disclosure
- Load `references/skill-matrix.md` (when available) for the full skill-to-domain routing table.

## SOP: Orchestration Workflow

### Step 1 - Intent Classification
Receive the user's request and classify it along two axes:

**Complexity:**
- `simple`: A single domain is affected (e.g., "fix this SQL query", "style this button").
- `compound`: Multiple domains are affected (e.g., "add a checkout flow" = DB + API + Frontend + Security).
- `full-build`: Greenfield application (requires plan -> all domains -> devops -> infra).

**User Type (infer from language and context):**
- `technical`: Uses precise terminology, references files, provides stack context.
- `non-technical`: Describes the idea, not the implementation. May not know what a "schema" is.

Adjust communication style accordingly. For non-technical users, avoid jargon in routing explanations.

### Step 2 - Prerequisite Gate (Hard Rule)
Before dispatching any domain skill, check:

- [ ] Has the `plan` skill been invoked and produced a checklist? If not, invoke it first.
- [ ] Is the tech stack confirmed? If not, the `plan` skill must resolve it.
- [ ] Is there a database schema for this feature? If the feature touches data, `db` skill runs before `backend`.
- [ ] Is authentication required? `security` skill must define the auth strategy before `api` skill builds endpoints.

Do not skip this gate. An executor without a plan is how projects get rebuilt from scratch.

### Step 3 - Domain Skill Routing

Use this matrix to determine which skills apply:

| User Intent Signals | Skills Invoked | Order |
|---|---|---|
| "Build a new app / full stack" | plan, system-architecture, db, backend, api, frontend, ui-ux, security, devops | Sequential per phase |
| "I need an API endpoint / backend feature" | plan, db (if schema change), backend, api | Sequential |
| "I need a UI component / page" | plan, ui-ux (if new flow), frontend | Sequential |
| "I need a database / schema design" | plan, db | Sequential |
| "Review / audit the codebase" | audit | Standalone |
| "Write documentation for X" | docs | Standalone |
| "I want a deployment setup" | devops, infra | Sequential |
| "Summarize / report on status" | report | Standalone |

When a request is `compound`, fan out to multiple domain skills but respect the dependency order:
`db` must precede `backend`, `backend` + `api` must precede `frontend`.

### Step 4 - Dispatch Log
After routing is decided, output a brief dispatch plan so the user understands what will happen:

**Format:**
```
Routing Plan for: [User Request]
User Type: [technical / non-technical]
Complexity: [simple / compound / full-build]

Dispatch Order:
1. plan - Define requirements and checklist
2. db - Design schema for [entities]
3. backend - Implement service and repository layers
4. api - Define [REST/GraphQL] endpoints
5. frontend - Build [components described]
6. security - Apply [auth/auth checks]
```

### Step 5 - Error Recovery Protocol
If a domain skill fails or produces incomplete output, the orchestrator must:

1. Identify the failed step in the dispatch log.
2. Determine if the failure is a blocker for downstream skills (it usually is).
3. Re-invoke the failed skill with additional context before proceeding.
4. Never silently skip a step and continue.

### Step 6 - Progress Tracking
After each domain skill completes, append its status to the dispatch log:

```
1. [x] plan - Checklist produced (8 tasks)
2. [x] db - `users` and `sessions` tables migrated
3. [/] backend - UserRepository complete, AuthService in progress
4. [ ] api - Pending backend
```

This log is the source of truth for what has been done and what is next.
