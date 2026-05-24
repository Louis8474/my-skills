# Remove Setting Method

**Category:** Simplifying Method Calls
**Sources:** Fowler Ch.6, Shvets Ch.10

## Problem

A field should be set at creation time and never changed afterward, but the class exposes a setter method. The setter invites callers to mutate state that was intended to be immutable, leading to subtle bugs when objects are modified after construction.

## Motivation

If a field should not change after an object is created, making it settable via a public method sends the wrong signal. Callers may set the value at inappropriate times, breaking invariants. Removing the setter enforces immutability at the API level — the field can only be set during construction, and the compiler (or runtime) prevents accidental mutation.

## When to Apply

- A field should be immutable after construction
- A setter exists but is only called during initialization
- Callers misuse the setter to change state that should be fixed
- You want to enforce invariants that depend on the field never changing

## Mechanics

1. Set the field's value in the constructor (or factory function) only
2. Remove the setter method
3. Make the field private / read-only / final
4. Update all callers to pass the value at construction time
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Person:
    def __init__(self, name: str, id_: str):
        self._name = name
        self._id = id_

    def set_id(self, id_: str):
        self._id = id_

    @property
    def id(self) -> str:
        return self._id

# Caller can mutate after construction — dangerous
person = Person("Alice", "P-001")
person.set_id("P-999")  # should not be allowed

# AFTER
class Person:
    def __init__(self, name: str, id_: str):
        self._name = name
        self._id = id_

    @property
    def id(self) -> str:
        return self._id

    # No setter — id is fixed at construction

person = Person("Alice", "P-001")
# person.set_id("P-999")  # AttributeError — no such method
```

### TypeScript

```typescript
// BEFORE
class Person {
  private _id: string;
  constructor(public name: string, id: string) {
    this._id = id;
  }
  setId(id: string): void {
    this._id = id;
  }
  get id(): string {
    return this._id;
  }
}

const person = new Person("Alice", "P-001");
person.setId("P-999"); // should not be allowed

// AFTER
class Person {
  constructor(
    public readonly name: string,
    private readonly _id: string
  ) {}

  get id(): string {
    return this._id;
  }
  // No setter — id is fixed at construction
}

const person = new Person("Alice", "P-001");
// person.setId("P-999"); // compile error — method does not exist
```

### Go

```go
// BEFORE
type Person struct {
	Name string
	id   string
}

func NewPerson(name, id string) *Person {
	return &Person{Name: name, id: id}
}

func (p *Person) SetID(id string) { p.id = id }
func (p *Person) ID() string      { return p.id }

// Caller:
// p := NewPerson("Alice", "P-001")
// p.SetID("P-999") // should not be allowed

// AFTER
type Person struct {
	Name string
	id   string
}

func NewPerson(name, id string) *Person {
	return &Person{Name: name, id: id}
}

func (p *Person) ID() string { return p.id }
// No SetID method — id is fixed at construction
```

### Rust

```rust
// In Rust, fields are immutable by default — this is already the norm.
// The BEFORE case would require explicit `mut` or a setter that takes `&mut self`.

// BEFORE — unnecessary setter
struct Person {
    name: String,
    id: String,
}

impl Person {
    fn new(name: &str, id: &str) -> Self {
        Self { name: name.into(), id: id.into() }
    }
    fn set_id(&mut self, id: &str) { self.id = id.into(); }
    fn id(&self) -> &str { &self.id }
}

// AFTER — just remove the setter; immutability is the default
struct Person {
    name: String,
    id: String,
}

impl Person {
    fn new(name: &str, id: &str) -> Self {
        Self { name: name.into(), id: id.into() }
    }
    fn id(&self) -> &str { &self.id }
    // No set_id — callers cannot mutate id after construction
}
```

## Related Smells

Mutable Data

## Inverse

(none)
