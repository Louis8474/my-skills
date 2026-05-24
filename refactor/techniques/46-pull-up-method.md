# Pull Up Method / Pull Up Field

**Category:** Dealing with Generalization
**Sources:** Fowler Ch.12, Shvets Ch.11

## Problem

Two or more sibling types share identical method logic. The duplicated code must be kept in sync across all siblings, and any fix or enhancement must be repeated in each copy.

## Motivation

When sibling classes implement the same method body, the duplication is a maintenance burden. Moving the shared method to a common parent eliminates the duplication and ensures consistency. If the method uses data, pull up the field too.

## When to Apply

- Two or more sibling types have methods with identical (or near-identical) bodies
- The shared behavior is logically part of the common abstraction
- You are adding the same method to a third sibling and realize it already exists elsewhere

## Mechanics

1. Inspect the candidate methods — confirm they are identical (or refactor until they are)
2. If the method uses fields, ensure those fields exist in the parent (pull up fields first)
3. Move the method to the parent type
4. Remove the duplicate methods from siblings
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Engineer:
    def __init__(self, name: str, salary: float):
        self.name = name
        self.salary = salary

    def annual_cost(self) -> float:
        return self.salary * 12

class Manager:
    def __init__(self, name: str, salary: float):
        self.name = name
        self.salary = salary

    def annual_cost(self) -> float:
        return self.salary * 12  # duplicated

# AFTER
class Employee:
    def __init__(self, name: str, salary: float):
        self.name = name
        self.salary = salary

    def annual_cost(self) -> float:
        return self.salary * 12

class Engineer(Employee):
    pass

class Manager(Employee):
    pass
```

### TypeScript

```typescript
// BEFORE
class Engineer {
  constructor(public name: string, public salary: number) {}
  annualCost(): number { return this.salary * 12; }
}

class Manager {
  constructor(public name: string, public salary: number) {}
  annualCost(): number { return this.salary * 12; } // duplicated
}

// AFTER
abstract class Employee {
  constructor(public name: string, public salary: number) {}
  annualCost(): number { return this.salary * 12; }
}

class Engineer extends Employee {}
class Manager extends Employee {}
```

### Go

```go
// Go has no superclass — use a shared helper function + interface.

// BEFORE
type Engineer struct{ Name string; Salary float64 }
func (e *Engineer) AnnualCost() float64 { return e.Salary * 12 }

type Manager struct{ Name string; Salary float64 }
func (m *Manager) AnnualCost() float64 { return m.Salary * 12 } // duplicated

// AFTER — shared via embedding
type employeeBase struct {
	Name   string
	Salary float64
}

func (b *employeeBase) AnnualCost() float64 { return b.Salary * 12 }

type Engineer struct{ employeeBase }
type Manager struct{ employeeBase }

// Both promote AnnualCost() from the embedded struct
```

### Rust

```rust
// Rust has no superclass — use a trait with a default method.

// BEFORE
struct Engineer { name: String, salary: f64 }
impl Engineer {
    fn annual_cost(&self) -> f64 { self.salary * 12.0 }
}

struct Manager { name: String, salary: f64 }
impl Manager {
    fn annual_cost(&self) -> f64 { self.salary * 12.0 } // duplicated
}

// AFTER — shared via trait with default implementation
trait Employee {
    fn salary(&self) -> f64;
    fn annual_cost(&self) -> f64 { self.salary() * 12.0 }
}

struct Engineer { name: String, salary: f64 }
impl Employee for Engineer {
    fn salary(&self) -> f64 { self.salary }
}

struct Manager { name: String, salary: f64 }
impl Employee for Manager {
    fn salary(&self) -> f64 { self.salary }
}
```

## Language Notes

- **Go**: No classical inheritance. Use struct embedding to share fields and methods. The embedded struct's methods are promoted to the outer struct, achieving the same effect as pulling a method into a parent class.
- **Rust**: No classical inheritance. Use a trait with a default method implementation. Concrete types implement the trait's required methods, and the default method provides the shared logic.

## Related Smells

Duplicated Code

## Inverse

Push Down Method (#47)
