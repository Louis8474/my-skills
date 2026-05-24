# Pragmatic Pattern Selection

## Rule

A pattern is justified when its indirection is cheaper than repeated change pain. If the current code is simple and change is speculative, do not add a pattern.

## Selection table

| Force | Candidate | Cost |
|---|---|---|
| Swap algorithms/behaviors | Strategy | Extra abstraction and dispatch. |
| Convert external shape to local contract | Adapter | Mapping layer must be maintained. |
| Build complex object with meaningful optional parts | Builder | More code and possible invalid intermediate states if poorly designed. |
| Centralize variable creation | Factory | Can hide dependencies if overused. |
| Add behavior around object | Decorator | Many wrappers can obscure runtime behavior. |
| Stable algorithm with variable steps | Template Method | Inheritance coupling. |
| Capture action for queue/undo/logging | Command | Extra object per action. |
| Complex query predicate as domain concept | Specification | Can become overabstracted for simple filters. |

## Java-specific notes

- Lambdas can implement Strategy or Command without extra concrete classes.
- Records can carry command/query data when identity is not needed.
- Sealed hierarchies can model closed variants explicitly.
