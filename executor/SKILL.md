---
name: executor
description: Strictly and autonomously implements a single task item from a planner-generated checklist. Enforces the rule of exploring before writing, applying atomic edits, running self-validation, and reporting status. Use this skill when a specific task item is ready to be implemented. Always use executor for individual checklist items rather than trying to implement everything in one shot.
---

# Executor Skill

## Purpose
The executor is the hands of the system. It takes one clearly defined task from the plan checklist and implements it precisely: no more, no less. Its value is discipline - it prevents the AI from making sweeping changes across the codebase when asked to do one thing, which is the primary cause of hard-to-debug regressions.

## SOP: Execution Workflow

### Step 1 - Task Intake (Read Before Writing)
Receive the task item. Before writing any code:

1. Read the task description carefully. Identify: what file(s) will change, what interfaces are touched, what the success condition is.
2. Locate and read the relevant existing files. Never assume file structure.
3. Identify what exists that this task builds upon (e.g., "add a column to `users`" - read the existing migration file first).

If the task description is ambiguous (e.g., "add user auth"), stop and ask for clarification before proceeding. Do not make assumptions that affect architecture.

### Step 2 - Atomic Edit Principle
Each execution implements exactly one logical change. If a task involves:
- Creating a new DB migration - create ONLY the migration file.
- Implementing a new API route - create ONLY the route handler + Pydantic models.
- Building a React component - create ONLY the `.tsx` file + its co-located type file.

Do not refactor adjacent code unless the task explicitly requires it. The reason: unrelated changes make git diffs harder to review and introduce risk for no benefit.

### Step 3 - Code Authoring Standards

**Python (Backend):**
- Use type hints on all function signatures: `async def get_user(user_id: UUID) -> UserOut:`.
- Use `pydantic.BaseModel` for all data shapes crossing a layer boundary.
- Keep functions under 40 lines. Extract helper functions if needed.
- Raise specific exceptions, not bare `Exception`: `raise HTTPException(status_code=404, detail="User not found")`.

**TypeScript (Frontend):**
- Define a `Props` interface for every component: `interface ButtonProps { label: string; onClick: () => void; }`.
- Never use `any`. Use `unknown` with a type guard if the shape is dynamic.
- Co-locate component logic and display: one `.tsx` file per component, hook in the same file if under 30 lines, else extract to `use<Name>.ts`.
- Use `const` for all declarations; avoid `let` unless mutation is required.

**SQL (Migrations):**
- Always create Alembic migrations via `alembic revision --autogenerate -m "description"`.
- Review the generated migration before applying. Never edit a migration that has already been applied to production.
- Every `upgrade()` function must have a corresponding `downgrade()` function.

### Step 4 - Self-Correction Loop
After writing, before reporting as done:

1. Read the file you just wrote. Look for obvious errors (unclosed brackets, missing imports, undefined variables).
2. If a linter/type-checker is available, run it: `npx tsc --noEmit` for TypeScript, `mypy` or `ruff check` for Python.
3. If there are errors, fix them now. Do not report "done" with known lint errors.
4. If a test exists for the affected module, run it. If it fails, debug before reporting.

### Step 5 - Completion Report
After a successful implementation, report status with exact specificity:

**Format:**
```
[x] Task: [Task description]
Files changed:
  - Created: src/models/user.py (UserBase, UserCreate, UserOut Pydantic models)
  - Modified: src/api/v1/users.py (added POST /users/{id}/avatar route)
Validation: tsc --noEmit passed, 0 errors. pytest test_user_api.py::test_create_user passed.
Next task: [Next item from checklist]
```

Never report "done" without the files-changed and validation lines.

### Step 6 - Escalation Rule
If you encounter something that changes the scope of the plan (e.g., adding auth to one endpoint reveals the entire API needs a middleware change), stop and flag it:

```
[!] Scope Change Detected
Task: [current task]
Discovery: [what was found]
Impact: [which other tasks are affected]
Recommendation: [update plan / add tasks / re-sequence]
```

Do not silently expand scope. Route back to the `plan` skill to update the checklist.
