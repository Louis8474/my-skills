# Replace Type Code with Subclasses

**Category:** Organizing Data
**Sources:** Fowler Ch.12, Shvets Ch.7

## Problem

A type code field (string or integer) controls behavior through conditionals. Every function that varies by type contains a switch or if-else chain, and adding a new type means modifying every one of these conditionals — a violation of the Open/Closed Principle.

## Motivation

Subclasses (or interface implementations, or enum variants with data) let you replace conditionals with polymorphism. Each type encapsulates its own behavior, and adding a new type means adding a new class — not editing existing code. This also enables type-specific data: an `Engineer` can have a `specialty` field that a `Manager` doesn't need.

## When to Apply

- A type code field (string/int/enum) is checked in switch/if statements to vary behavior
- Adding a new type requires modifying multiple functions
- Different types carry different data but are forced into the same struct
- The same switch appears in multiple places (Repeated Switches smell)

## Mechanics

1. Create a subclass/variant for each type code value
2. Move type-specific behavior into each subclass (override methods)
3. Move type-specific data into the appropriate subclass
4. Replace conditionals with polymorphic calls
5. Remove the type code field
6. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Employee:
    def __init__(self, name: str, type_code: str, base_salary: float):
        self.name = name
        self.type_code = type_code
        self.base_salary = base_salary

    def annual_bonus(self) -> float:
        if self.type_code == "engineer":
            return self.base_salary * 0.10
        elif self.type_code == "manager":
            return self.base_salary * 0.20
        elif self.type_code == "executive":
            return self.base_salary * 0.40
        else:
            raise ValueError(f"Unknown type: {self.type_code}")

# AFTER
from abc import ABC, abstractmethod

class Employee(ABC):
    def __init__(self, name: str, base_salary: float):
        self.name = name
        self.base_salary = base_salary

    @abstractmethod
    def annual_bonus(self) -> float: ...

class Engineer(Employee):
    def annual_bonus(self) -> float:
        return self.base_salary * 0.10

class Manager(Employee):
    def annual_bonus(self) -> float:
        return self.base_salary * 0.20

class Executive(Employee):
    def annual_bonus(self) -> float:
        return self.base_salary * 0.40
```

### TypeScript

```typescript
// BEFORE
class Employee {
  constructor(
    public name: string,
    public typeCode: "engineer" | "manager" | "executive",
    public baseSalary: number
  ) {}

  annualBonus(): number {
    switch (this.typeCode) {
      case "engineer": return this.baseSalary * 0.10;
      case "manager":  return this.baseSalary * 0.20;
      case "executive": return this.baseSalary * 0.40;
    }
  }
}

// AFTER
abstract class Employee {
  constructor(public name: string, public baseSalary: number) {}
  abstract annualBonus(): number;
}

class Engineer extends Employee {
  annualBonus(): number { return this.baseSalary * 0.10; }
}

class Manager extends Employee {
  annualBonus(): number { return this.baseSalary * 0.20; }
}

class Executive extends Employee {
  annualBonus(): number { return this.baseSalary * 0.40; }
}
```

### Go

```go
// BEFORE
type Employee struct {
	Name       string
	TypeCode   string
	BaseSalary float64
}

func (e Employee) AnnualBonus() float64 {
	switch e.TypeCode {
	case "engineer":
		return e.BaseSalary * 0.10
	case "manager":
		return e.BaseSalary * 0.20
	case "executive":
		return e.BaseSalary * 0.40
	default:
		panic("unknown type: " + e.TypeCode)
	}
}

// AFTER — use interface + implementations (Go has no classes/inheritance)
type Employee interface {
	Name() string
	AnnualBonus() float64
}

type Engineer struct {
	name       string
	baseSalary float64
}

func (e Engineer) Name() string         { return e.name }
func (e Engineer) AnnualBonus() float64 { return e.baseSalary * 0.10 }

type Manager struct {
	name       string
	baseSalary float64
}

func (m Manager) Name() string         { return m.name }
func (m Manager) AnnualBonus() float64 { return m.baseSalary * 0.20 }

type Executive struct {
	name       string
	baseSalary float64
}

func (x Executive) Name() string         { return x.name }
func (x Executive) AnnualBonus() float64 { return x.baseSalary * 0.40 }
```

### Rust

```rust
// BEFORE
struct Employee {
    name: String,
    type_code: String,
    base_salary: f64,
}

impl Employee {
    fn annual_bonus(&self) -> f64 {
        match self.type_code.as_str() {
            "engineer"  => self.base_salary * 0.10,
            "manager"   => self.base_salary * 0.20,
            "executive" => self.base_salary * 0.40,
            other => panic!("Unknown type: {other}"),
        }
    }
}

// AFTER — use enum variants with data (idiomatic Rust)
enum Employee {
    Engineer  { name: String, base_salary: f64 },
    Manager   { name: String, base_salary: f64 },
    Executive { name: String, base_salary: f64 },
}

impl Employee {
    fn annual_bonus(&self) -> f64 {
        match self {
            Employee::Engineer  { base_salary, .. } => base_salary * 0.10,
            Employee::Manager   { base_salary, .. } => base_salary * 0.20,
            Employee::Executive { base_salary, .. } => base_salary * 0.40,
        }
    }

    fn name(&self) -> &str {
        match self {
            Employee::Engineer  { name, .. }
            | Employee::Manager   { name, .. }
            | Employee::Executive { name, .. } => name,
        }
    }
}
```

## Related Smells

Primitive Obsession, Repeated Switches, Long Method

## Inverse

(none)
