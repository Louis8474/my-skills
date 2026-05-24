# Hide Delegate

**Category:** Moving Features
**Sources:** Fowler Ch.7-8, Shvets Ch.7

## Problem

A client navigates an object chain to reach a distant object: `person.department.manager`. This couples the client to the internal structure — if the chain changes, every client breaks.

## Motivation

Encapsulation means reducing what each part of the system needs to know about other parts. When a client reaches through an object to get to another object, it knows about the intermediate structure. By creating a delegating method on the server, you hide the chain and shield clients from structural changes.

## When to Apply

- A client accesses through a chain of references (`a.b.c`)
- The intermediate structure might change (e.g., department might be reorganized)
- Multiple clients traverse the same chain
- You want to reduce coupling between subsystems

## Mechanics

1. Create a delegating method on the server (the first object in the chain)
2. Adjust the client to call the server's new method instead
3. If no client needs direct access to the delegate, remove the accessor for it
4. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Department:
    def __init__(self, manager: "Employee"):
        self.manager = manager

class Person:
    def __init__(self, name: str, department: Department):
        self.name = name
        self.department = department

# Client code:
manager = person.department.manager

# AFTER
class Department:
    def __init__(self, manager: "Employee"):
        self.manager = manager

class Person:
    def __init__(self, name: str, department: Department):
        self.name = name
        self._department = department

    @property
    def manager(self) -> "Employee":
        return self._department.manager

# Client code:
manager = person.manager
```

### TypeScript

```typescript
// BEFORE
class Department {
  constructor(public manager: Employee) {}
}

class Person {
  constructor(public name: string, public department: Department) {}
}

// Client code:
const manager = person.department.manager;

// AFTER
class Department {
  constructor(public manager: Employee) {}
}

class Person {
  constructor(public name: string, private _department: Department) {}

  get manager(): Employee {
    return this._department.manager;
  }
}

// Client code:
const manager = person.manager;
```

### Go

```go
// BEFORE
type Department struct {
	Manager *Employee
}

type Person struct {
	Name       string
	Department *Department
}

// Client code:
// manager := person.Department.Manager

// AFTER
type Department struct {
	Manager *Employee
}

type Person struct {
	Name       string
	department *Department
}

func (p *Person) Manager() *Employee {
	return p.department.Manager
}

// Client code:
// manager := person.Manager()
```

### Rust

```rust
// BEFORE
struct Department {
    manager: Employee,
}

struct Person {
    name: String,
    department: Department,
}

// Client code:
// let manager = &person.department.manager;

// AFTER
struct Department {
    manager: Employee,
}

struct Person {
    name: String,
    department: Department,
}

impl Person {
    fn manager(&self) -> &Employee {
        &self.department.manager
    }
}

// Client code:
// let manager = person.manager();
```

## Related Smells

Message Chains

## Inverse

Remove Middle Man (#13)
