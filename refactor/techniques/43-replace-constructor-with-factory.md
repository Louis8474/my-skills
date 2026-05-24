# Replace Constructor with Factory Function

**Category:** Simplifying Method Calls
**Sources:** Fowler Ch.6, Shvets Ch.10
**Also known as:** Replace Constructor with Factory Method

## Problem

A constructor is too simple to handle complex creation logic. You need more flexibility: returning different subtypes, providing descriptive creation names, or encapsulating conditional logic that doesn't belong in a constructor.

## Motivation

Constructors are constrained — they must return the exact type, they can't have descriptive names, and they can't cache or return existing instances. Factory functions remove these limitations. When you have a constructor that takes a type code to determine behavior, or when creation logic is complex, a factory function communicates intent better and gives you room to evolve.

## When to Apply

- Constructor takes a type code or flag to determine which variant to create
- You need named constructors for clarity (`create_engineer` vs `create_manager`)
- Complex creation logic clutters the constructor
- You want to return a subtype or interface without exposing concrete types
- You need to control instance creation (caching, pooling)

## Mechanics

1. Create a factory function (or static/class method) with a descriptive name
2. Move the constructor logic into the factory function
3. Replace all constructor calls with factory function calls
4. Consider making the original constructor private
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Employee:
    def __init__(self, type_code: str, name: str, salary: float):
        self.type_code = type_code
        self.name = name
        self.salary = salary

    def bonus(self) -> float:
        if self.type_code == "engineer":
            return self.salary * 0.1
        elif self.type_code == "manager":
            return self.salary * 0.2
        return 0.0

emp = Employee("engineer", "Alice", 100000)

# AFTER
class Employee:
    def __init__(self, name: str, salary: float):
        self.name = name
        self.salary = salary

    def bonus(self) -> float:
        return 0.0

class Engineer(Employee):
    def bonus(self) -> float:
        return self.salary * 0.1

class Manager(Employee):
    def bonus(self) -> float:
        return self.salary * 0.2

def create_employee(type_code: str, name: str, salary: float) -> Employee:
    match type_code:
        case "engineer": return Engineer(name, salary)
        case "manager":  return Manager(name, salary)
        case _: raise ValueError(f"Unknown type: {type_code}")

emp = create_employee("engineer", "Alice", 100000)
```

### TypeScript

```typescript
// BEFORE
class Employee {
  constructor(
    public typeCode: string,
    public name: string,
    public salary: number
  ) {}

  bonus(): number {
    if (this.typeCode === "engineer") return this.salary * 0.1;
    if (this.typeCode === "manager") return this.salary * 0.2;
    return 0;
  }
}

const emp = new Employee("engineer", "Alice", 100000);

// AFTER
abstract class Employee {
  constructor(public name: string, public salary: number) {}
  abstract bonus(): number;

  static createEngineer(name: string, salary: number): Employee {
    return new Engineer(name, salary);
  }
  static createManager(name: string, salary: number): Employee {
    return new Manager(name, salary);
  }
}

class Engineer extends Employee {
  bonus(): number { return this.salary * 0.1; }
}

class Manager extends Employee {
  bonus(): number { return this.salary * 0.2; }
}

const emp = Employee.createEngineer("Alice", 100000);
```

### Go

```go
// BEFORE
type Employee struct {
	TypeCode string
	Name     string
	Salary   float64
}

func (e *Employee) Bonus() float64 {
	switch e.TypeCode {
	case "engineer": return e.Salary * 0.1
	case "manager":  return e.Salary * 0.2
	default:         return 0
	}
}

// AFTER
type Employee interface {
	Name() string
	Salary() float64
	Bonus() float64
}

type engineer struct{ name string; salary float64 }
func (e *engineer) Name() string     { return e.name }
func (e *engineer) Salary() float64  { return e.salary }
func (e *engineer) Bonus() float64   { return e.salary * 0.1 }

type manager struct{ name string; salary float64 }
func (m *manager) Name() string     { return m.name }
func (m *manager) Salary() float64  { return m.salary }
func (m *manager) Bonus() float64   { return m.salary * 0.2 }

func NewEngineer(name string, salary float64) Employee {
	return &engineer{name: name, salary: salary}
}

func NewManager(name string, salary float64) Employee {
	return &manager{name: name, salary: salary}
}
```

### Rust

```rust
// BEFORE
struct Employee {
    type_code: String,
    name: String,
    salary: f64,
}

impl Employee {
    fn bonus(&self) -> f64 {
        match self.type_code.as_str() {
            "engineer" => self.salary * 0.1,
            "manager"  => self.salary * 0.2,
            _ => 0.0,
        }
    }
}

// AFTER
trait Employee {
    fn name(&self) -> &str;
    fn salary(&self) -> f64;
    fn bonus(&self) -> f64;
}

struct Engineer { name: String, salary: f64 }
impl Employee for Engineer {
    fn name(&self) -> &str   { &self.name }
    fn salary(&self) -> f64  { self.salary }
    fn bonus(&self) -> f64   { self.salary * 0.1 }
}

struct Manager { name: String, salary: f64 }
impl Employee for Manager {
    fn name(&self) -> &str   { &self.name }
    fn salary(&self) -> f64  { self.salary }
    fn bonus(&self) -> f64   { self.salary * 0.2 }
}

// Associated functions serve as named constructors
impl Engineer {
    fn new(name: &str, salary: f64) -> Self {
        Self { name: name.into(), salary }
    }
}

impl Manager {
    fn new(name: &str, salary: f64) -> Self {
        Self { name: name.into(), salary }
    }
}
```

## Related Smells

(flexibility, type-code conditionals)

## Inverse

(none)
