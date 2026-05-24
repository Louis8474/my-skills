# Programming Practice Principles

## Core model

Good code is code that communicates intent, protects behavior, and can change at the speed the domain requires.

## Principles

- **Clarity first**: a future maintainer should understand what the code does and why the structure exists.
- **DRY is about knowledge**: duplication is harmful when the same business rule, protocol, or decision must change in multiple places.
- **KISS**: choose the simplest design that satisfies current known needs.
- **YAGNI**: do not add extension points without a credible change scenario.
- **High cohesion**: keep things together when they change for the same reason.
- **Low coupling**: avoid unnecessary knowledge of concrete details across boundaries.
- **Behavior preservation**: refactoring should not change observable behavior.

## Smell-to-action table

| Smell | First response |
|---|---|
| Long method | Extract intent-revealing steps only when each step has a meaningful name. |
| Repeated branch logic | Check whether it represents duplicated policy. |
| Generic helper bucket | Split by responsibility or inline accidental abstractions. |
| Boolean flags | Consider explicit methods, named options, or separate flows. |
| Deep nesting | Guard clauses or split phases if behavior remains readable. |
