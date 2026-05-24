# Language-Specific Idiom Guide for Refactoring

When translating Fowler/Shvets refactoring techniques to the target language, use these mappings. The original techniques use Java examples — this guide shows the idiomatic equivalent in each supported language.

## Python

| Java Concept | Python Equivalent |
|---|---|
| Class | `class` (same concept) |
| Abstract class | `abc.ABC` with `@abstractmethod` |
| Interface | `typing.Protocol` (structural) or `abc.ABC` (nominal) |
| `private` field | `_field` convention or `__field` name mangling |
| `protected` field | `_field` convention (no enforcement) |
| Getter / setter | `@property` decorator |
| `static` method | `@staticmethod` or module-level function |
| Factory method | `@classmethod` or module-level function |
| Builder pattern | `dataclass` with defaults, `__init__` with `**kwargs`, or fluent API |
| `final` class | No equivalent (use convention or `@final` from `typing`) |
| `extends` (inheritance) | `class Child(Parent)` |
| `implements` (interface) | Implicit via duck typing, or explicit via `ABC`/`Protocol` |
| Generics | `typing.Generic[T]` or Python 3.12+ `class Foo[T]` |
| `Optional<T>` | `Optional[T]` or `T | None` (3.10+) |
| Stream API | List comprehension, generator expression, or `itertools` |
| `Collections.unmodifiableList()` | `tuple` (immutable) or return a copy |
| `Objects.requireNonNull()` | `if x is None: raise ValueError(...)` |
| Enum | `enum.Enum` |
| `switch` / `if-else` chain | `match` (3.10+) or `if/elif/else` |
| `try-catch` | `try-except` |
| Lambda | `lambda x: expr` (single expression only) |
| Method reference | Function reference: `fn = obj.method` |
| `var` (local type inference) | Always inferred (no type declarations needed) |
| `record` (Java 16+) | `@dataclass(frozen=True)` |

## TypeScript

| Java Concept | TypeScript Equivalent |
|---|---|
| Class | `class` (same concept) |
| Abstract class | `abstract class` (same concept) |
| Interface | `interface` (structural typing) |
| `private` field | `private` keyword or `#field` (runtime private) |
| `protected` field | `protected` keyword |
| Getter / setter | `get prop()` / `set prop(v)` |
| `static` method | `static method()` |
| Factory method | `static create()` method or standalone function |
| Builder pattern | Fluent builder class or object spread with defaults |
| `final` class | No equivalent (use convention) |
| `extends` | `extends` (same) |
| `implements` | `implements` (same) |
| Generics | `<T>` (same syntax) |
| `Optional<T>` | `T | undefined` or `T | null` |
| Stream API | Array methods: `.filter()`, `.map()`, `.reduce()` |
| `Collections.unmodifiableList()` | `as const` or `readonly T[]` |
| `Objects.requireNonNull()` | Runtime check + type guard |
| Enum | `enum` or `const` union type |
| `switch` | `switch` (same) or discriminated union |
| `try-catch` | `try-catch` (same) |
| Lambda | Arrow function `(x) => expr` (full body support) |
| Method reference | `this.method.bind(this)` or arrow wrapper |
| `var` | `const` / `let` with type inference |
| `record` (Java 16+) | `interface` or `type` (structural) |

## Go

| Java Concept | Go Equivalent |
|---|---|
| Class | `struct` + methods with receiver |
| Abstract class | Interface + default implementation struct (no abstract) |
| Interface | `interface` (implicit satisfaction — no `implements`) |
| `private` field | Unexported (lowercase): `name` |
| `public` field | Exported (uppercase): `Name` |
| Getter / setter | `func (s *Struct) Name() string` / `func (s *Struct) SetName(n string)` |
| `static` method | Package-level function |
| Factory method | `func NewXxx(...) *Xxx` constructor function |
| Builder pattern | Functional options: `func WithTimeout(d time.Duration) Option` |
| `final` class | No equivalent (no inheritance) |
| `extends` | Embedding: `struct Child { Parent }` (composition, not inheritance) |
| `implements` | Implicit (implement the method set) |
| Generics | `[T any]` or `[T comparable]` (Go 1.18+) |
| `Optional<T>` | Pointer `*T` (nil = absent) or `(T, bool)` return |
| Stream API | `for range` loop (no pipeline; consider `lo` library) |
| `Collections.unmodifiableList()` | Return a copy (no built-in immutable collections) |
| `Objects.requireNonNull()` | `if x == nil { return fmt.Errorf(...) }` |
| Enum | `const` + `iota` |
| `switch` | `switch` (no fallthrough by default, `fallthrough` keyword to opt in) |
| `try-catch` | `if err != nil { return err }` — no exceptions |
| Lambda | Function literal: `func(x int) int { return x * 2 }` |
| Method reference | Method value: `f := obj.Method` |
| `var` | `:=` short declaration |
| `record` (Java 16+) | Plain `struct` (value semantics by default) |

## Rust

| Java Concept | Rust Equivalent |
|---|---|
| Class | `struct` + `impl` block |
| Abstract class | `trait` with default method implementations |
| Interface | `trait` |
| `private` field | Private by default (no keyword needed) |
| `public` field | `pub field: T` |
| Getter / setter | `fn name(&self) -> &str` / `fn set_name(&mut self, n: String)` |
| `static` method | Associated function: `fn new() -> Self` (no `self` parameter) |
| Factory method | `Type::new()` or `Type::from_xxx()` associated function |
| Builder pattern | Builder struct with `self`-consuming methods returning `Self` |
| `final` class | Default (no inheritance exists) |
| `extends` | No equivalent — use composition or trait default methods |
| `implements` | `impl Trait for Struct` |
| Generics | `<T: Trait>` or `impl Trait` parameter |
| `Optional<T>` | `Option<T>` (`Some(v)` / `None`) |
| Stream API | Iterator chain: `.iter().filter().map().collect()` |
| `Collections.unmodifiableList()` | `&[T]` slice (immutable borrow) or `Vec<T>` ownership transfer |
| `Objects.requireNonNull()` | Type system prevents null — use `Option<T>` and `.expect("msg")` |
| Enum | `enum` (algebraic data types with variants) |
| `switch` | `match` (exhaustive pattern matching) |
| `try-catch` | `Result<T, E>` + `?` operator — no exceptions |
| Lambda | Closure: `|x| x * 2` or `|x: i32| -> i32 { x * 2 }` |
| Method reference | No direct equivalent — use closure `|x| x.method()` |
| `var` | `let` with type inference |
| `record` (Java 16+) | `struct` (derive `Clone`, `Debug`, `PartialEq` as needed) |

## Cross-Language Refactoring Principles

| Principle | Python | TypeScript | Go | Rust |
|---|---|---|---|---|
| Extract Method → | Extract function or method | Extract function or method | Extract function (package-level or method) | Extract function or method |
| Extract Class → | Extract class or dataclass | Extract class or interface | Extract struct + methods | Extract struct + impl |
| Extract Interface → | Define Protocol | Define interface | Define interface | Define trait |
| Encapsulate Variable → | `@property` | `get`/`set` accessor | Getter/setter methods | Getter/setter methods |
| Replace Inheritance → | Use composition + Protocol | Use composition + interface | Already composition-based | Already composition-based |
| Replace Loop → | List comprehension / generator | `.map()` / `.filter()` | Idiomatic `for range` | `.iter().filter().map()` |
| Null Object → | Implement special-case class | Implement special-case class | Implement interface with defaults | Implement trait with defaults |
| Template Method → | Abstract base class + override | Abstract class + override | Interface + strategy func | Trait with default + override |
