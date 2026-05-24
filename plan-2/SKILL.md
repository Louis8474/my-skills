---
name: plan
description: Analyzes user requests to extract real requirements, identify risks, and produce a dependency-ordered execution checklist. Use this skill at the start of any multi-step build, feature addition, or complex debugging task. Trigger when the user says "build me", "create a", "I want to make", or describes a feature without a clear starting point.
---

# Planner Skill

## Purpose
This skill exists to prevent the single most common failure mode in AI-assisted development: jumping directly into code without understanding the system. Vibe-coders tend to describe what they want, not what they need. Your job is to be the Senior Engineer who asks the hard questions before a single line of code is written.

## Progressive Disclosure
- Load `references/risk-matrix.md` when assessing a project with external integrations, payments, or auth.
- Load `references/tech-decision-tree.md` when the user has not specified a tech stack.

## SOP: Planning Workflow

### Step 1 - Project Intake (Always First)
Before anything else, ask these questions. Do NOT start planning until you have answers:

1. Is this a new project (empty directory) or an existing codebase?
2. Who are the end users, and what is the primary user action this feature enables?
3. What is the expected scale at launch? (e.g., solo tool, startup MVP, enterprise)
4. Are there existing integrations or APIs this must connect to?
5. Is there a deadline or phased delivery expectation?

For non-technical users, reframe these as plain questions: "Is someone going to pay for this, or is it just for you? Will 10 people use it or 10,000?"

### Step 2 - Stack Discovery
If the project is new, ask:

> "Can I use the Supernova standard tech stack?
> - Backend: Python 3.12 + FastAPI
> - Frontend: Next.js 14 (App Router) + Tailwind + TypeScript + Shadcn/ui
> - Database: PostgreSQL 16 + SQLAlchemy 2.0 async
> - API style: REST for simple apps, GraphQL if data is deeply relational
>
> Do you have a preferred stack, or should I proceed with these defaults?"

If the project directory contains `package.json`, `requirements.txt`, `go.mod`, etc., detect the existing stack and use it. Do not ask.

### Step 3 - Requirements Decomposition
Decompose the user's vague intent into concrete, atomic requirements:

- **Functional Requirements:** What the system must do (e.g., "User can upload an avatar image and see it on their profile").
- **Non-Functional Requirements (NFRs):** Performance, security, scaling (e.g., "Avatar upload must handle files up to 5MB, images stored in S3, URLs cached in DB").
- **Out of Scope:** Explicitly state what is NOT being built in this phase to prevent scope creep.

### Step 4 - Risk Identification
Flag obvious risks before execution begins. Categorize as:

| Risk | Category | Mitigation |
|---|---|---|
| Auth token expiry not handled | Security | Add refresh token logic to plan |
| N+1 query likely in product listing | Performance | Add eager loading to DB task |
| No error boundary on payment flow | Reliability | Add try/except + rollback to API task |

### Step 5 - Dependency Ordering
Order tasks so that each one only depends on tasks already completed. The correct default order is:

1. Database schema and migrations
2. Backend models and repositories
3. API routes and business logic
4. Frontend data fetching hooks/services
5. Frontend UI components
6. Integration tests and E2E validation

Never plan frontend tasks before the API contract is defined.

### Step 6 - Execution Checklist Output
Produce the final plan as a strict Markdown checklist. This is handed to the `executor` skill.

**Format:**
```markdown
## Plan: [Feature Name]

### Context
- Stack: [Confirmed stack]
- Scope: [What is in/out]

### Risks
- [Risk]: [Mitigation]

### Execution Checklist
#### Phase 1: Database
- [ ] Create `users` table migration with UUID PK, email unique constraint, `created_at` auto-timestamp
- [ ] Add `avatar_url VARCHAR(512)` column with nullable default

#### Phase 2: Backend
- [ ] Implement `UserRepository.get_by_id(user_id: UUID)` with async SQLAlchemy
- [ ] Implement `POST /api/v1/users/{id}/avatar` endpoint with file validation (5MB limit, JPEG/PNG only)
- [ ] Write pytest unit test for file size validation logic

#### Phase 3: Frontend
- [ ] Create `useUploadAvatar()` hook with `react-query` mutation and optimistic UI update
- [ ] Build `<AvatarUpload />` Shadcn/ui `Dialog` component with drag-and-drop zone
```

## Key Principles
- A plan with 3 well-defined tasks is better than a plan with 15 vague ones.
- If the user resists the intake questions, explain why: "Building without a plan is why projects get rebuilt from scratch after 2 weeks." Frame it as saving them time, not gatekeeping.
- Plans are living documents. Update the checklist throughout execution as new requirements surface.
