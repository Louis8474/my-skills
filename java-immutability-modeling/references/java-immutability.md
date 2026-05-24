# Java Immutability Modeling

## Records

Records are useful for transparent immutable aggregates. The compiler provides fields, accessors, constructor, `equals`, `hashCode`, and `toString`.

Use records when:

- the type is primarily data;
- components define the state;
- equality is value-based;
- invariants can be checked in the canonical/compact constructor.

Avoid records when:

- identity matters more than state;
- framework lifecycle requires mutation/proxies;
- behavior hides or derives most state;
- component list is unstable public API.

## Defensive copies

Mutable inputs such as `List`, arrays, `Date`, or mutable domain objects can break immutability.

Use:

- `List.copyOf(input)` for immutable collection copies that reject null elements;
- `new ArrayList<>(input)` when internal controlled mutation is required;
- copied accessors when returning mutable internals.

## Invariant placement

Validate invariants at construction so invalid instances cannot exist.
