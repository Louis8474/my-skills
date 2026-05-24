---
title: Intents
description: High-level statements of purpose that drive development
---

## What is an Intent?

An **Intent** is a high-level statement of purpose that encapsulates what needs to be achieved — whether a business goal, feature, or technical outcome. It serves as the starting point for AI-driven decomposition.

Think of an Intent as the answer to "What do we want to build?" without getting into the details of "How do we build it?"

## Examples of Intents

Good intents are clear, outcome-focused, and appropriately scoped:

- **User Authentication System** — Enable users to securely register, login, and manage their accounts
- **Product Catalog with Search** — Allow customers to browse and search products with filters
- **Payment Processing** — Integrate payment gateway for secure transactions
- **Real-time Notifications** — Push notifications to users for important events

## Intent Structure

When captured, an Intent becomes a directory in your Memory Bank:

```
memory-bank/intents/{intent-name}/
├── requirements.md      # User stories, acceptance criteria, NFRs
├── system-context.md    # Boundaries, interfaces, constraints
└── units/               # Decomposed units
    ├── {unit-1}/
    └── {unit-2}/
```

## Creating an Intent

Use the Inception Agent:

```
/specsmd-inception-agent intent-create
```

The agent will guide you through:
1. **Describe Your Goal** — Explain what you want to achieve in plain language
2. **Answer Clarifying Questions** — The AI asks questions to minimize ambiguity
3. **Review Requirements** — Validate the generated user stories and NFRs
4. **Define Context** — Establish system boundaries and constraints

## Intent vs Epic

| Aspect | Agile Epic | AI-DLC Intent |
|--------|------------|---------------|
| **Definition** | Large body of work | Statement of purpose |
| **Decomposition** | Manual by team | AI-powered |
| **Output** | User stories | Units with stories |
| **Context** | Lost over time | Persisted in Memory Bank |

## Requirements Document

The `requirements.md` file contains:

```markdown
# Intent: User Authentication System

## User Stories

### US-001: User Registration
As a new user, I want to register with email and password
so that I can create an account.

**Acceptance Criteria:**
- [ ] Email validation
- [ ] Password strength requirements
- [ ] Confirmation email sent

## Non-Functional Requirements

### NFR-001: Security
- Passwords must be hashed with bcrypt
- Sessions expire after 24 hours
- Rate limiting on login attempts
```

## System Context

The `system-context.md` defines boundaries:

```markdown
# System Context: User Authentication

## In Scope
- User registration and login
- Password reset flow
- Session management

## Out of Scope
- Social login (OAuth) - future intent
- Multi-factor authentication - future intent

## Interfaces
- REST API for frontend
- Database for user storage
- Email service for notifications

## Constraints
- Must use existing PostgreSQL database
- Must integrate with current session store
```

## Best Practices

- **Keep Intents Focused** — One intent should represent one cohesive goal. If you find yourself saying "and also...", consider splitting.
- **Be Outcome-Oriented** — Focus on what users will be able to do, not technical implementation details.
- **Include Context** — Provide relevant business context, constraints, and dependencies upfront.
- **Iterate on Requirements** — Requirements will evolve. Use the agent to refine and clarify as you learn more.
