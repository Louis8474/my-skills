# Extract Superclass / Extract Base Type

**Category:** Dealing with Generalization
**Sources:** Fowler Ch.12, Shvets Ch.11

## Problem

Two types have shared fields and behavior but no common parent. The duplication across these types is a maintenance burden, and the shared concept is implicit rather than explicit in the code.

## Motivation

When two classes share fields and methods, there is often an underlying concept that deserves its own type. Extracting a superclass (or base type) captures this shared concept, eliminates duplication, and enables polymorphism. In languages without inheritance, extracting a shared interface or embedded struct achieves the same goal.

## When to Apply

- Two or more types share fields and methods with identical logic
- A common abstraction emerges (e.g., Department and Employee both have `annual_cost`)
- You want polymorphism over the shared behavior
- New types need the same shared behavior

## Mechanics

1. Identify the shared fields and methods across the candidate types
2. Create a new parent type with the shared fields and methods
3. Have each original type extend or embed the new parent
4. Move shared logic into the parent, remove it from the children
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Department:
    def __init__(self, name: str, staff: list):
        self.name = name
        self.staff = staff

    def annual_cost(self) -> float:
        return sum(s.salary * 12 for s in self.staff)

class Employee:
    def __init__(self, name: str, salary: float):
        self.name = name
        self.salary = salary

    def annual_cost(self) -> float:
        return self.salary * 12

# AFTER
from abc import ABC, abstractmethod

class Party(ABC):
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def annual_cost(self) -> float: ...

class Employee(Party):
    def __init__(self, name: str, salary: float):
        super().__init__(name)
        self.salary = salary

    def annual_cost(self) -> float:
        return self.salary * 12

class Department(Party):
    def __init__(self, name: str, staff: list[Employee]):
        super().__init__(name)
        self.staff = staff

    def annual_cost(self) -> float:
        return sum(e.annual_cost() for e in self.staff)
```

### TypeScript

```typescript
// BEFORE
class Department {
  constructor(public name: string, public staff: Employee[]) {}
  annualCost(): number {
    return this.staff.reduce((sum, e) => sum + e.salary * 12, 0);
  }
}

class Employee {
  constructor(public name: string, public salary: number) {}
  annualCost(): number { return this.salary * 12; }
}

// AFTER
abstract class Party {
  constructor(public name: string) {}
  abstract annualCost(): number;
}

class Employee extends Party {
  constructor(name: string, public salary: number) {
    super(name);
  }
  annualCost(): number { return this.salary * 12; }
}

class Department extends Party {
  constructor(name: string, public staff: Employee[]) {
    super(name);
  }
  annualCost(): number {
    return this.staff.reduce((sum, e) => sum + e.annualCost(), 0);
  }
}
```

### Go

```go
// Go: extract an interface for shared behavior + embedded struct for shared state.

// BEFORE
type Department struct {
	Name  string
	Staff []*Employee
}

func (d *Department) AnnualCost() float64 {
	total := 0.0
	for _, e := range d.Staff {
		total += e.Salary * 12
	}
	return total
}

type Employee struct {
	Name   string
	Salary float64
}

func (e *Employee) AnnualCost() float64 { return e.Salary * 12 }

// AFTER
type Party interface {
	PartyName() string
	AnnualCost() float64
}

type partyBase struct{ Name string }
func (b *partyBase) PartyName() string { return b.Name }

type Employee struct {
	partyBase
	Salary float64
}

func (e *Employee) AnnualCost() float64 { return e.Salary * 12 }

type Department struct {
	partyBase
	Staff []Party
}

func (d *Department) AnnualCost() float64 {
	total := 0.0
	for _, p := range d.Staff {
		total += p.AnnualCost()
	}
	return total
}
```

### Rust

```rust
// Rust: extract a trait for the shared behavior.

// BEFORE
struct Department { name: String, staff: Vec<Employee> }

impl Department {
    fn annual_cost(&self) -> f64 {
        self.staff.iter().map(|e| e.salary * 12.0).sum()
    }
}

struct Employee { name: String, salary: f64 }

impl Employee {
    fn annual_cost(&self) -> f64 { self.salary * 12.0 }
}

// AFTER
trait Party {
    fn name(&self) -> &str;
    fn annual_cost(&self) -> f64;
}

struct Employee { name: String, salary: f64 }

impl Party for Employee {
    fn name(&self) -> &str { &self.name }
    fn annual_cost(&self) -> f64 { self.salary * 12.0 }
}

struct Department {
    name: String,
    staff: Vec<Box<dyn Party>>,
}

impl Party for Department {
    fn name(&self) -> &str { &self.name }
    fn annual_cost(&self) -> f64 {
        self.staff.iter().map(|p| p.annual_cost()).sum()
    }
}
```

## Language Notes

- **Go**: No inheritance. Extract a shared interface for the polymorphic behavior and use struct embedding for shared fields. The interface enables polymorphic collections (e.g., `[]Party`).
- **Rust**: No inheritance. Extract a trait for the shared behavior. Use trait objects (`Box<dyn Party>`) for polymorphic collections. Shared fields stay in each struct (Rust has no field inheritance).

## Related Smells

Duplicated Code

## Inverse

Collapse Hierarchy (#51)
