---
name: design-patterns-pragmatic
description: "Trigger: design patterns, GoF patterns, Java patterns, strategy, adapter, factory, builder, decorator, observer. Choose patterns only when they solve real design forces."
license: MIT
metadata:
  author: andresnator
  version: "1.0.0"
---

# Skill: design-patterns-pragmatic

## Activation Contract

Use this skill when asked whether to use a design pattern, how to apply a pattern, or how to compare pattern-based alternatives. Examples include Strategy, Factory, Builder, Adapter, Decorator, Template Method, Observer, Command, Repository, and Specification.

Do **not** use this skill to add patterns for decoration, replace simple code without a change pressure, or perform full architecture design unrelated to a specific pattern choice.

## Responsibility

This skill teaches pragmatic pattern selection and application. It does not call other skills, force GoF terminology, or choose complexity without tradeoff justification.

## Required Context

- Current problem and change pressure.
- Existing code shape or intended collaboration.
- Language and framework constraints.
- Expected variants, extension points, or integration boundaries.

## Context Budget

- Keep this `SKILL.md` focused on selection workflow.
- Use `references/pattern-selection.md` for the pattern decision table.

## Hard Rules

- Start from the design force, not the pattern name.
- Prefer no pattern when simple code is clearer.
- Introduce indirection only when it reduces real change cost.
- Name the cost: extra types, navigation, testing surface, and cognitive load.
- For Java, consider lambdas, records, sealed classes, and composition before classic boilerplate-heavy patterns.

## Decision Gates

| Condition | Action |
|---|---|
| Behavior varies behind one operation | Consider Strategy. |
| External API shape does not match local model | Consider Adapter. |
| Object construction is complex with meaningful optional parts | Consider Builder. |
| Creation logic must vary by family/type | Consider Factory. |
| Feature wraps another object transparently | Consider Decorator. |
| Algorithm skeleton is stable but steps vary | Consider Template Method, but check inheritance cost. |
| Simple branch is enough | Do not introduce a pattern yet. |

## Execution Steps

1. State the design force and expected variation.
2. Compare simple code vs candidate pattern.
3. Choose the smallest pattern shape that solves the force.
4. Explain tradeoffs and rejected alternatives.
5. Provide a minimal sketch when useful.

## Output Contract

Return:

- Pattern verdict: `no_pattern`, `pattern_candidate`, or `pattern_recommended`.
- Design force.
- Chosen pattern or simpler alternative.
- Tradeoffs.
- Minimal implementation sketch or next step.

## Validation Scenarios

| Scenario | Expected behavior | Must not do |
|---|---|---|
| Happy path | Recommend a pattern tied to real variation/integration force. | Add pattern jargon with no reason. |
| Ambiguous input | Ask what variation/change is expected. | Assume future extensibility. |
| Out of scope | Decline broad architecture request without pattern decision context. | Produce a pattern catalog dump. |

## References

- `references/pattern-selection.md` — Pattern selection and tradeoff table.

## Assets

- None.
