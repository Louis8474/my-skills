# Technique Applicability by Language

Legend: **Y** = fully applicable, **A** = applicable with adaptation (see notes), **N** = not applicable (use alternative)

## Full Matrix

| # | Technique | Python | TS | Go | Rust | Notes |
|---|---|:---:|:---:|:---:|:---:|---|
| 01 | Extract Method | Y | Y | Y | Y | |
| 02 | Inline Method | Y | Y | Y | Y | |
| 03 | Extract Variable | Y | Y | Y | Y | |
| 04 | Inline Variable | Y | Y | Y | Y | |
| 05 | Replace Temp with Query | Y | Y | Y | Y | |
| 06 | Replace Method with Method Object | Y | Y | Y | Y | Go: struct + method; Rust: struct + impl |
| 07 | Substitute Algorithm | Y | Y | Y | Y | |
| 08 | Move Method | Y | Y | Y | Y | Go: move to different struct or package |
| 09 | Move Field | Y | Y | Y | Y | |
| 10 | Extract Class | Y | Y | Y | Y | Go: extract struct; Rust: extract struct + impl |
| 11 | Inline Class | Y | Y | Y | Y | |
| 12 | Hide Delegate | Y | Y | Y | Y | |
| 13 | Remove Middle Man | Y | Y | Y | Y | |
| 14 | Move Statements | Y | Y | Y | Y | |
| 15 | Split Loop | Y | Y | Y | Y | |
| 16 | Replace Loop with Pipeline | Y | Y | A | Y | Go: idiomatic `for range` preferred over pipeline libs |
| 17 | Remove Dead Code | Y | Y | Y | Y | |
| 18 | Encapsulate Variable | Y | Y | Y | Y | Python: `@property`; Go: getter/setter methods |
| 19 | Encapsulate Record | Y | Y | Y | Y | Python: `@dataclass`; Go/Rust: struct |
| 20 | Encapsulate Collection | Y | Y | Y | Y | Rust: return `&[T]` slice or iterator |
| 21 | Replace Primitive with Object | Y | Y | Y | Y | Go: named type; Rust: newtype pattern |
| 22 | Split Variable | Y | Y | Y | Y | |
| 23 | Rename Field | Y | Y | Y | Y | |
| 24 | Replace Derived Variable with Query | Y | Y | Y | Y | |
| 25 | Change Reference to Value | Y | Y | Y | Y | Rust: default (ownership semantics) |
| 26 | Change Value to Reference | Y | Y | Y | A | Rust: use `Rc<T>` / `Arc<T>` |
| 27 | Replace Type Code with Subclasses | Y | Y | A | Y | Go: interface + implementations; Rust: enum variants |
| 28 | Decompose Conditional | Y | Y | Y | Y | |
| 29 | Consolidate Conditional | Y | Y | Y | Y | |
| 30 | Replace Nested Conditional with Guard Clauses | Y | Y | Y | Y | |
| 31 | Replace Conditional with Polymorphism | Y | Y | Y | Y | Go: interface dispatch; Rust: trait dispatch or enum + match |
| 32 | Introduce Special Case | Y | Y | Y | Y | |
| 33 | Introduce Assertion | Y | Y | Y | Y | Rust: `debug_assert!` |
| 34 | Replace Control Flag | Y | Y | Y | Y | |
| 35 | Change Function Declaration | Y | Y | Y | Y | |
| 36 | Introduce Parameter Object | Y | Y | Y | Y | Python: `@dataclass`; Go/Rust: struct |
| 37 | Parameterize Function | Y | Y | Y | Y | |
| 38 | Remove Flag Argument | Y | Y | Y | Y | |
| 39 | Preserve Whole Object | Y | Y | Y | Y | Rust: pass `&obj` reference |
| 40 | Replace Parameter with Query | Y | Y | Y | Y | |
| 41 | Replace Query with Parameter | Y | Y | Y | Y | |
| 42 | Remove Setting Method | Y | Y | Y | Y | Rust: don't impl setter (default immutable) |
| 43 | Replace Constructor with Factory | Y | Y | Y | Y | Go: `NewXxx()` func; Rust: `Type::new()` |
| 44 | Replace Function with Command | Y | Y | Y | Y | |
| 45 | Separate Query from Modifier | Y | Y | Y | Y | |
| 46 | Pull Up Method | Y | Y | A | A | Go: extract shared interface + helper func; Rust: trait default method |
| 47 | Push Down Method | Y | Y | A | A | Go: remove from shared, add to specific struct; Rust: remove default impl |
| 48 | Pull Up Constructor Body | Y | Y | N | N | Go: shared `init()` helper; Rust: shared `::new()` logic in helper |
| 49 | Extract Superclass | Y | Y | A | A | Go: extract interface; Rust: extract trait |
| 50 | Extract Interface | Y | Y | Y | Y | Go: implicit interfaces; Rust: trait |
| 51 | Collapse Hierarchy | Y | Y | A | A | Go: inline embedded struct; Rust: remove trait layer |
| 52 | Form Template Method | Y | Y | A | A | Go: func field or strategy interface; Rust: trait with default methods |
| 53 | Replace Subclass with Delegate | Y | Y | Y | Y | Go/Rust: already composition-native |
| 54 | Replace Superclass with Delegate | Y | Y | N | N | Go/Rust: no superclass exists — already use composition |
| 55 | Replace Inheritance with Delegation | Y | Y | N | N | Go/Rust: no inheritance exists — already use delegation |
| 56 | Combine Functions into Class | Y | Y | Y | Y | Go: struct + methods; Rust: struct + impl |
| 57 | Combine Functions into Transform | Y | Y | Y | Y | |
| 58 | Split Phase | Y | Y | Y | Y | |
| 59 | Introduce Foreign Method | Y | Y | A | A | Go: package-level function; Rust: extension trait |
| 60 | Introduce Local Extension | Y | Y | A | A | Go: wrapper struct; Rust: newtype wrapper |
| 61 | Replace Error Code with Exception | Y | Y | N | N | Go: use `error` values; Rust: use `Result<T,E>` |
| 62 | Replace Exception with Test | Y | Y | A | A | Go/Rust: check before calling (already the default pattern) |

## Go Alternatives for Non-Applicable Techniques

### Inheritance-Based Techniques (Group 6)

Go has no classical inheritance. These are the idiomatic Go equivalents:

| Technique | Go Alternative |
|---|---|
| **Pull Up Method** (#46) | Define a shared interface. If the logic is identical, create a helper function that takes the interface as a parameter. |
| **Push Down Method** (#47) | Remove the method from the embedded struct. Add it to each specific struct that needs it. |
| **Pull Up Constructor Body** (#48) | Create a shared `initXxx()` helper function that both structs call in their constructors. |
| **Extract Superclass** (#49) | Extract an interface. If shared state is needed, create a base struct and embed it. |
| **Collapse Hierarchy** (#51) | Inline the embedded struct's fields and methods directly into the outer struct. |
| **Form Template Method** (#52) | Use a strategy pattern: define an interface for the varying part, pass it as a field or parameter. |
| **Replace Superclass with Delegate** (#54) | Already the Go way — Go uses composition by default. |
| **Replace Inheritance with Delegation** (#55) | Already the Go way — no inheritance exists. |

### Error Handling Techniques

| Technique | Go Alternative |
|---|---|
| **Replace Error Code with Exception** (#61) | Return `error` values instead. Define custom error types with `errors.New()` or implement the `error` interface. |
| **Replace Exception with Test** (#62) | Already the Go pattern — check conditions before calling (defensive checks before operations). |

### Extension Techniques

| Technique | Go Alternative |
|---|---|
| **Introduce Foreign Method** (#59) | Create a package-level function that takes the type as a parameter: `func FormatUser(u User) string`. |
| **Introduce Local Extension** (#60) | Create a wrapper struct: `type EnhancedUser struct { User }` with additional methods on the wrapper. |

## Rust Alternatives for Non-Applicable Techniques

### Inheritance-Based Techniques (Group 6)

Rust has no classical inheritance. These are the idiomatic Rust equivalents:

| Technique | Rust Alternative |
|---|---|
| **Pull Up Method** (#46) | Define a trait with a default method implementation. Types that share the behavior implement the trait. |
| **Push Down Method** (#47) | Remove the default implementation from the trait. Each type provides its own `impl`. |
| **Pull Up Constructor Body** (#48) | Create a shared helper function for common initialization logic. Call it from each type's `::new()`. |
| **Extract Superclass** (#49) | Extract a trait. If shared state is needed, use composition (field of shared type). |
| **Collapse Hierarchy** (#51) | Remove the intermediate trait. Inline its methods into the concrete type's `impl`. |
| **Form Template Method** (#52) | Use a trait with default methods that call required methods (trait method = template, required method = hook). |
| **Replace Superclass with Delegate** (#54) | Already the Rust way — Rust uses composition by default. |
| **Replace Inheritance with Delegation** (#55) | Already the Rust way — no inheritance exists. |

### Error Handling Techniques

| Technique | Rust Alternative |
|---|---|
| **Replace Error Code with Exception** (#61) | Return `Result<T, E>` with custom error types. Use `thiserror` crate for ergonomic error definitions. |
| **Replace Exception with Test** (#62) | Already the Rust pattern — check `Option`/`Result` before unwrapping. Use `if let` or `match` instead of `.unwrap()`. |

### Extension Techniques

| Technique | Rust Alternative |
|---|---|
| **Introduce Foreign Method** (#59) | Define an extension trait: `trait UserExt { fn format(&self) -> String; }` and `impl UserExt for User { ... }`. |
| **Introduce Local Extension** (#60) | Use the newtype pattern: `struct EnhancedUser(User)` and implement methods on the wrapper. |
