---
name: java-solid-design
description: "Trigger: Java SOLID, Java OO design, SRP, OCP, LSP, ISP, DIP, composition over inheritance. Evaluate Java object-oriented design tradeoffs."
license: MIT
metadata:
  author: andresnator
  version: "1.0.0"
---

# Skill: java-solid-design

## Activation Contract

Use this skill when asked to evaluate or improve Java object-oriented design using SOLID, cohesion, coupling, composition, inheritance, interfaces, and dependency direction.

Do **not** use this skill for simple naming/style cleanup, pattern shopping, framework wiring only, or non-Java code.

## Responsibility

This skill teaches Java SOLID design review. It does not call other skills, prescribe interfaces everywhere, or force pattern usage.

## Required Context

- Classes/interfaces involved.
- Change scenario or pain point.
- Public API compatibility constraints.
- Existing dependency direction and lifecycle ownership.

## Context Budget

- Keep this `SKILL.md` executable.
- Use `references/solid-java.md` for principle-specific guidance.

## Hard Rules

- Do not apply SOLID mechanically; connect every recommendation to a real change pressure.
- Prefer composition over inheritance unless subtype substitution is genuinely valid.
- Introduce interfaces for stable contracts or test/design seams, not ceremony.
- Protect LSP: subclasses must honor superclass/interface contracts.
- Keep dependencies pointing toward stable policy, not volatile details.
- Avoid splitting responsibilities so far that workflow becomes harder to understand.

## Decision Gates

| Condition | Action |
|---|---|
| Class has multiple reasons to change | Propose responsibility split around change axes. |
| Conditional selects behavior by type | Consider polymorphism or strategy only if variants are stable. |
| Interface has unrelated methods | Split by client needs. |
| High-level policy depends on concrete detail | Invert dependency at the boundary. |
| Inheritance violates substitutability | Replace with composition or sealed/final hierarchy. |

## Execution Steps

1. Identify the primary responsibility and change reasons.
2. Map dependencies and extension points.
3. Check each SOLID principle only where relevant.
4. Recommend the smallest design change that reduces future change cost.
5. State tradeoffs and rejected overengineering.

## Output Contract

Return:

- SOLID verdict by relevant principle.
- Concrete design risks.
- Recommended redesign or no-change rationale.
- Tradeoffs and compatibility concerns.
- Minimal next step.

## Validation Scenarios

| Scenario | Expected behavior | Must not do |
|---|---|---|
| Happy path | Diagnose actual SOLID pressure and recommend focused change. | Recite all SOLID principles generically. |
| Ambiguous input | Ask for change scenario or infer with clear assumptions. | Create abstractions without reason. |
| Out of scope | Decline non-design Java cleanup as SOLID work. | Force SOLID labels onto style issues. |

## References

- `references/solid-java.md` — Java-focused SOLID decision guidance.

## Assets

- None.
