---
name: java-clean-code
description: "Trigger: Java clean code, Java naming, Java readability, Java style, Java maintainability. Improve Java code clarity using modern Java and official guidance."
license: MIT
metadata:
  author: andresnator
  version: "1.0.0"
---

# Skill: java-clean-code

## Activation Contract

Use this skill when reviewing or improving Java code for readability, naming, structure, idiomatic style, method/class size, comments, constants, and maintainability.

Do **not** use this skill for non-Java code, test-writing, deep refactoring catalogs, security-only review, performance tuning, or framework-specific configuration.

## Responsibility

This skill teaches Java clean-code review and improvement. It does not call other skills, introduce new architecture by default, or change behavior unless explicitly requested.

## Required Context

- Java version when known.
- Code under review or the file/class purpose.
- Existing team style if it differs from common Java conventions.
- Whether public API compatibility must be preserved.

## Context Budget

- Keep this `SKILL.md` focused on the review workflow.
- Use `references/java-clean-code-guidance.md` for naming and official-source notes.

## Hard Rules

- Preserve behavior unless the user asks for behavior change.
- Prefer expressive names over comments that explain unclear code.
- Use Java naming conventions: classes as nouns, methods as verbs, variables meaningful, constants uppercase with underscores.
- Do not create `Utils`/`Helper` buckets unless responsibility is explicit and cohesive.
- Avoid premature abstraction; first make the current intent obvious.
- Treat Oracle Code Conventions as archived historical guidance; prefer modern Java practices where they differ.

## Decision Gates

| Condition | Action |
|---|---|
| Names hide intent | Rename before restructuring. |
| Method mixes levels of abstraction | Extract named private methods if behavior stays clearer. |
| Comments explain what code does | Prefer making code self-explanatory; keep comments for why/constraints. |
| Magic literal appears | Replace with named constant only when it carries domain meaning or repeated policy. |
| Code can use modern Java construct | Recommend it only if it improves readability for the project’s Java version. |

## Execution Steps

1. Identify the class or method responsibility.
2. Review names, structure, comments, literals, and nesting.
3. Separate style issues from design issues.
4. Recommend the smallest clarity improvement first.
5. Note Java-version-dependent suggestions explicitly.
6. Return a concise review or patch plan.

## Output Contract

Return:

- Java clean-code verdict.
- Issues by impact.
- Suggested changes with before/after examples when useful.
- Java version assumptions.
- Risks or behavior-preservation notes.

## Validation Scenarios

| Scenario | Expected behavior | Must not do |
|---|---|---|
| Happy path | Improve Java naming/structure with behavior-preserving suggestions. | Rewrite architecture unnecessarily. |
| Ambiguous input | Ask for Java version or state assumption. | Use features unsupported by the project. |
| Out of scope | Decline non-Java-specific use. | Pretend generic code is Java. |

## References

- `references/java-clean-code-guidance.md` — Java naming, structure, and official-source notes.

## Assets

- None.
