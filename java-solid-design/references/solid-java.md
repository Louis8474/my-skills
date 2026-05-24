# SOLID in Java

## SRP — Single Responsibility

Responsibility means a reason to change, not “one method” or “one tiny class.” Split classes when policy, orchestration, persistence, formatting, or integration concerns evolve independently.

## OCP — Open/Closed

Use extension points only for expected variation. For rare or speculative changes, simple modification is cheaper than premature abstraction.

## LSP — Liskov Substitution

Subtypes must preserve contracts: accepted inputs, returned guarantees, side effects, exceptions, and invariants. If a subtype weakens the promise, prefer composition.

## ISP — Interface Segregation

Interfaces should match client needs. Avoid fat interfaces that force implementers to throw unsupported exceptions or no-op methods.

## DIP — Dependency Inversion

High-level policy should not depend on volatile details. In Java, dependency inversion can be achieved with interfaces, constructor injection, modules, package boundaries, or simple callback functions.

## Java-specific cautions

- Do not create `IThing` interfaces only because a class exists.
- Use `final` or sealed types when extension is not part of the contract.
- Package-private collaborators are often enough inside a module/package boundary.
