---
name: parallel
description: Coordinates simultaneous execution of independent tasks to reduce total build time. Use this skill when multiple tasks from the plan checklist have no dependencies between them and can be safely executed concurrently. Trigger when the plan has tasks in the same phase that do not share data or files.
---

# Parallel Execution Skill

## Purpose
Parallel execution is a force multiplier, but only when applied correctly. The danger is attempting to parallelize tasks that share state or sequenced dependencies, which produces race conditions, merge conflicts, and corrupted outputs. This skill defines an exact protocol for identifying which tasks are safe to parallelize and how to safely aggregate their results.

## SOP: Parallel Execution Workflow

### Step 1 - Parallelizability Assessment
Before fanning out, evaluate each candidate task pair:

**Safe to parallelize (shared-nothing):**
- Two migration files for unrelated tables (e.g., `products` migration and `reviews` migration that don't FK to each other).
- Two separate UI components with no shared state (e.g., `<Header />` and `<Footer />`).
- Two separate API routes that don't call each other's services.
- Documentation for different modules.

**Not safe to parallelize (shared-state risk):**
- A migration AND the model/repository that depends on it (must be sequential: schema first).
- Two routes that write to the same table without row-level locking awareness.
- A service that creates a record AND a second service that immediately reads that same record.
- Any two tasks that modify the same file.

Apply the **file intersection test:** list the files each task will touch. If any files appear in both lists, the tasks cannot run in parallel.

### Step 2 - Fan-Out Dispatch
Once safe tasks are identified, dispatch them simultaneously. Track each as a named unit:

**Format:**
```
Parallel Batch [N]:
  - Unit A: [Task description] -> Owns: [file list]
  - Unit B: [Task description] -> Owns: [file list]
  - Unit C: [Task description] -> Owns: [file list]
(No file overlap confirmed)
```

Each unit is independent and must apply the `executor` skill's standards internally.

### Step 3 - Partial Failure Handling
Do not allow one failed unit to silently block aggregation. When any unit fails:

1. Mark it as failed in the batch summary.
2. Complete all other units that did not depend on the failed one.
3. Report the failure clearly before attempting a fix.
4. Re-run only the failed unit, not the entire batch.

Never drop a failed task and move on. The system is only as strong as its weakest completed task.

### Step 4 - Aggregation and Merge
After all units complete, perform a merge validation:

1. No two units created the same import/export name in the same namespace.
2. If both units added entries to a shared config file (e.g., `tailwind.config.ts`, `alembic/env.py`), merge them manually and validate the combined file.
3. Run a single integration validation after all parallel outputs are merged: `npx tsc --noEmit` for TypeScript, `pytest` for Python. Fix any cross-unit conflicts.

### Step 5 - Results Matrix Output
Produce a structured summary after the batch completes:

**Format:**
```
Parallel Batch [N] Results:
| Unit | Task | Status | Files Created/Modified | Validation |
|------|------|--------|------------------------|------------|
| A | Create <Header /> component | Done | src/components/Header.tsx | tsc: 0 errors |
| B | Create <Footer /> component | Done | src/components/Footer.tsx | tsc: 0 errors |
| C | Create <Sidebar /> component | Failed | - | Missing Shadcn dependency |

Action Required: Unit C - run `npx shadcn@latest add sheet` then re-execute.
```
