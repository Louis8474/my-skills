---
name: refactor-java
description: "Comprehensive catalog of 60+ Java refactoring techniques for behavior-preserving code improvements."
license: "MIT"
metadata:
  author: andresnator
  version: 1.2.1
---

# Java Refactoring Catalog Skill

A comprehensive, technique-by-technique catalog of refactoring best practices for Java, sourced from Martin Fowler's *Refactoring: Improving the Design of Existing Code* (2nd Edition) and Alexander Shvets' *Refactoring in Java* (Refactoring Guru).

## Core Philosophy

**Refactoring is the process of changing the internal structure of code without altering its observable behavior.** It is a disciplined technique, not a random cleanup. The golden rule is: Cover → Modify → Refactor (always have tests before you start).

## Java Refactor Quality Gate

Before declaring a Java refactor complete, review the result against this gate:

- **Behavior preservation**: no bug fix or externally observable behavior change is mixed into the refactor.
- **Readability and naming**: names explain intent; extracted methods/classes reduce cognitive load rather than hiding simple code.
- **Cohesion**: moved or extracted code belongs with the data and behavior that change together.
- **SOLID restraint**: apply SOLID principles only where real change pressure exists; avoid mechanical abstractions.
- **Pragmatic patterns**: choose the simplest design that handles known variation; do not introduce a pattern by default.
- **API compatibility**: public signatures, visibility, mutability, serialization, and caller contracts are preserved unless the task explicitly allows an API change.
- **Exception robustness**: do not swallow exceptions, broaden them unnecessarily, or use exceptions as normal control flow.
- **Immutability/modeling**: prefer clear ownership, defensive copies, records/value objects, or invariants when they simplify reasoning.
- **Useful-only JavaDoc**: add or keep JavaDoc only when it explains non-obvious intent, contracts, invariants, edge cases, threading/lifecycle expectations, or public API obligations. Remove or avoid JavaDoc that merely restates the method name, parameters, or implementation.

## How to Use This Skill

1. **Diagnose first**: Identify the code smell (see `techniques/00-code-smells-diagnostic.md`)
2. **Select technique**: Each smell maps to one or more refactoring techniques
3. **Read the technique file**: Each technique has its own markdown file in `techniques/` with problem description, motivation, step-by-step mechanics, and Java 8 + Java 11 examples
4. **Apply incrementally**: Small steps, test after each change, commit frequently

## Technique Categories

The techniques are organized in 7 groups. Each technique has its own file in the `techniques/` directory.

### Group 1: Composing Methods (techniques/01-XX)
Techniques for building clean, well-structured methods. The foundation of all refactoring.
- `01-extract-method.md` — Extract a code fragment into a named method
- `02-inline-method.md` — Replace a method call with the method body
- `03-extract-variable.md` — Give a name to a complex expression
- `04-inline-variable.md` — Remove a variable that adds no clarity
- `05-replace-temp-with-query.md` — Replace temp variables with method calls
- `06-replace-method-with-method-object.md` — Turn a complex method into its own class
- `07-substitute-algorithm.md` — Replace an algorithm with a clearer version

### Group 2: Moving Features (techniques/02-XX)
Techniques for placing code where it truly belongs.
- `08-move-method.md` — Move a method to where it has more cohesion
- `09-move-field.md` — Move a field to the class that uses it most
- `10-extract-class.md` — Split a class with multiple responsibilities
- `11-inline-class.md` — Merge a class that does too little
- `12-hide-delegate.md` — Encapsulate chain navigation behind a simpler interface
- `13-remove-middle-man.md` — Remove unnecessary delegation
- `14-move-statements.md` — Move statements into/out of functions, slide statements
- `15-split-loop.md` — Separate a loop that does multiple things
- `16-replace-loop-with-pipeline.md` — Use Stream API instead of imperative loops
- `17-remove-dead-code.md` — Delete unused code

### Group 3: Organizing Data (techniques/03-XX)
Techniques for enriching data with behavior and protecting internal state.
- `18-encapsulate-variable.md` — Wrap data access with getters/setters
- `19-encapsulate-record.md` — Convert data structures into objects
- `20-encapsulate-collection.md` — Protect collections from external mutation
- `21-replace-primitive-with-object.md` — Create domain types instead of using raw primitives
- `22-split-variable.md` — Give each purpose its own variable
- `23-rename-field.md` — Improve field names for clarity
- `24-replace-derived-variable-with-query.md` — Calculate values on demand
- `25-change-reference-to-value.md` — Make objects immutable (Value Objects)
- `26-change-value-to-reference.md` — Share a single instance across consumers
- `27-replace-type-code-with-subclasses.md` — Convert type codes to polymorphic hierarchy

### Group 4: Simplifying Conditionals (techniques/04-XX)
Techniques for taming conditional complexity.
- `28-decompose-conditional.md` — Name condition and branches
- `29-consolidate-conditional.md` — Merge related conditions
- `30-replace-nested-conditional-with-guard-clauses.md` — Early returns for special cases
- `31-replace-conditional-with-polymorphism.md` — Use OOP instead of switch/if-type
- `32-introduce-special-case.md` — Null Object pattern for default behavior
- `33-introduce-assertion.md` — Document invariants with executable assertions
- `34-replace-control-flag.md` — Replace boolean flags with break/return

### Group 5: Simplifying Method Calls / API Design (techniques/05-XX)
Techniques for building self-documenting interfaces.
- `35-change-function-declaration.md` — Rename functions and change parameters
- `36-introduce-parameter-object.md` — Group related parameters into an object
- `37-parameterize-function.md` — Unify similar functions with a parameter
- `38-remove-flag-argument.md` — Replace boolean params with named methods
- `39-preserve-whole-object.md` — Pass the object instead of extracted values
- `40-replace-parameter-with-query.md` — Let the function calculate what it needs
- `41-replace-query-with-parameter.md` — Pass value as param for purity/testability
- `42-remove-setting-method.md` — Make properties read-only
- `43-replace-constructor-with-factory.md` — Use factory methods for flexible creation
- `44-replace-function-with-command.md` — Encapsulate function as object
- `45-separate-query-from-modifier.md` — CQS: separate reads from writes

### Group 6: Dealing with Inheritance (techniques/06-XX)
Techniques for refactoring class hierarchies.
- `46-pull-up-method.md` — Move duplicated methods to superclass
- `47-push-down-method.md` — Move specialized methods to subclass
- `48-pull-up-constructor-body.md` — Unify constructor initialization
- `49-extract-superclass.md` — Create common superclass for shared behavior
- `50-extract-interface.md` — Define a contract without implementation
- `51-collapse-hierarchy.md` — Merge unnecessary hierarchy levels
- `52-form-template-method.md` — Template Method pattern from GoF
- `53-replace-subclass-with-delegate.md` — Composition over inheritance
- `54-replace-superclass-with-delegate.md` — Replace extends with has-a
- `55-replace-inheritance-with-delegation.md` — General inheritance to delegation

### Group 7: Additional Techniques (techniques/07-XX)
Cross-cutting techniques from both sources.
- `56-combine-functions-into-class.md` — Group functions that share data
- `57-combine-functions-into-transform.md` — Enrich read-only data
- `58-split-phase.md` — Separate code into processing phases
- `59-introduce-foreign-method.md` — Extend third-party classes you can't modify
- `60-introduce-local-extension.md` — Subclass or wrapper for library extension
- `61-replace-error-code-with-exception.md` — Modernize error handling
- `62-replace-exception-with-test.md` — Don't use exceptions for control flow

## Diagnostic Guide

Start with `techniques/00-code-smells-diagnostic.md` to identify which techniques apply to your code. The diagnostic maps 24 code smells to their recommended refactoring techniques.

## Applying the Skill

When given Java code to refactor:

1. Read `techniques/00-code-smells-diagnostic.md` to identify the smells present
2. For each identified smell, read the corresponding technique file(s)
3. Apply techniques in small steps, always testing between changes
4. Provide both Java 8 and Java 11 versions when the language features differ meaningfully
5. Explain WHY each refactoring improves the code, not just HOW to do it
6. Report the Java Refactor Quality Gate verdict, including any useful-only JavaDoc decision

## Key Principles

These principles underpin every technique in the catalog:

1. **Names matter more than length** — a well-named 1-line method is better than an inline expression
2. **Small steps** — extract small fragments, test, commit. Never batch multiple changes
3. **Intention over implementation** — code should communicate WHAT, not HOW
4. **Data and logic that change together should live together** — cohesion is king
5. **Prefer composition over inheritance** — delegation is more flexible than extends
6. **Immutability is a powerful preservative** — immutable data is easier to reason about
7. **CQS (Command-Query Separation)** — a method either returns a value or modifies state, never both

---

## Full Skill Description

<!-- auto-moved from frontmatter `description:` field because it exceeded codex's 1024-character limit. The frontmatter now has a shortened summary. Full original preserved verbatim below. -->

Comprehensive catalog of 60+ Java refactoring techniques for behavior-preserving code improvements. Trigger when the task is Java refactoring, code-smell cleanup, restructuring, API-compatible design improvement, or a named refactoring technique. This skill is the right lazy-load signal when the worker must preserve observable behavior, check public-contract compatibility, apply useful-only JavaDoc, and produce one Java Refactor Quality Gate verdict. Covers Java 8 and Java 11+ examples for every technique. Even if the user just pastes Java code and asks for improvement suggestions, use this skill to identify applicable techniques. También se activa en castellano: "refactorizar", "refactorizar código Java", "mejorar este código", "malos olores del código", "olores de código", "código sucio", "limpiar código", "simplificar condicionales", "principios SOLID", "cómo mejorar este código", "código limpio", "reestructurar clase", "mejorar calidad del código", "técnica de refactorización", "extraer método", "renombrar variable", "mover método", "eliminar código duplicado", "reducir complejidad", "mejorar legibilidad", "reorganizar código".
