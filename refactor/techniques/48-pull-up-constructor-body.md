# Pull Up Constructor Body

**Category:** Dealing with Generalization
**Sources:** Fowler Ch.12, Shvets Ch.11

## Problem

Constructors in subtypes contain duplicated initialization logic. The same field assignments appear in every subtype constructor, and changes must be made in multiple places.

## Motivation

When every subtype constructor sets the same fields the same way, the duplication is a maintenance hazard. Moving the shared initialization into a parent constructor (or a shared init helper) ensures consistency and eliminates the copy-paste pattern.

## When to Apply

- Multiple subtype constructors set the same fields with the same logic
- A new subtype is being added and you are copy-pasting constructor code
- Shared initialization logic has diverged across subtypes (bug)

## Mechanics

1. Identify the common initialization code across subtype constructors
2. Move it to the parent constructor (or shared init helper)
3. Have each subtype constructor call the parent constructor (super/base)
4. Keep only subtype-specific initialization in the subtype constructor
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Manager:
    def __init__(self, name: str, id_: str, salary: float, department: str):
        self.name = name
        self.id = id_
        self.salary = salary
        self.department = department

class Engineer:
    def __init__(self, name: str, id_: str, salary: float, language: str):
        self.name = name
        self.id = id_
        self.salary = salary
        self.language = language

# AFTER
class Employee:
    def __init__(self, name: str, id_: str, salary: float):
        self.name = name
        self.id = id_
        self.salary = salary

class Manager(Employee):
    def __init__(self, name: str, id_: str, salary: float, department: str):
        super().__init__(name, id_, salary)
        self.department = department

class Engineer(Employee):
    def __init__(self, name: str, id_: str, salary: float, language: str):
        super().__init__(name, id_, salary)
        self.language = language
```

### TypeScript

```typescript
// BEFORE
class Manager {
  name: string;
  id: string;
  salary: number;
  department: string;

  constructor(name: string, id: string, salary: number, department: string) {
    this.name = name;
    this.id = id;
    this.salary = salary;
    this.department = department;
  }
}

class Engineer {
  name: string;
  id: string;
  salary: number;
  language: string;

  constructor(name: string, id: string, salary: number, language: string) {
    this.name = name;
    this.id = id;
    this.salary = salary;
    this.language = language;
  }
}

// AFTER
abstract class Employee {
  constructor(
    public name: string,
    public id: string,
    public salary: number
  ) {}
}

class Manager extends Employee {
  constructor(name: string, id: string, salary: number, public department: string) {
    super(name, id, salary);
  }
}

class Engineer extends Employee {
  constructor(name: string, id: string, salary: number, public language: string) {
    super(name, id, salary);
  }
}
```

### Go

```go
// Go has no constructors or super() — use a shared init helper.

// BEFORE
type Manager struct {
	Name       string
	ID         string
	Salary     float64
	Department string
}

func NewManager(name, id string, salary float64, dept string) *Manager {
	return &Manager{Name: name, ID: id, Salary: salary, Department: dept}
}

type Engineer struct {
	Name     string
	ID       string
	Salary   float64
	Language string
}

func NewEngineer(name, id string, salary float64, lang string) *Engineer {
	return &Engineer{Name: name, ID: id, Salary: salary, Language: lang}
}

// AFTER — shared base via embedding
type employeeBase struct {
	Name   string
	ID     string
	Salary float64
}

func newEmployeeBase(name, id string, salary float64) employeeBase {
	return employeeBase{Name: name, ID: id, Salary: salary}
}

type Manager struct {
	employeeBase
	Department string
}

func NewManager(name, id string, salary float64, dept string) *Manager {
	return &Manager{employeeBase: newEmployeeBase(name, id, salary), Department: dept}
}

type Engineer struct {
	employeeBase
	Language string
}

func NewEngineer(name, id string, salary float64, lang string) *Engineer {
	return &Engineer{employeeBase: newEmployeeBase(name, id, salary), Language: lang}
}
```

### Rust

```rust
// Rust has no constructors or super() — use a shared base struct helper.

// BEFORE
struct Manager { name: String, id: String, salary: f64, department: String }

impl Manager {
    fn new(name: &str, id: &str, salary: f64, department: &str) -> Self {
        Self { name: name.into(), id: id.into(), salary, department: department.into() }
    }
}

struct Engineer { name: String, id: String, salary: f64, language: String }

impl Engineer {
    fn new(name: &str, id: &str, salary: f64, language: &str) -> Self {
        Self { name: name.into(), id: id.into(), salary, language: language.into() }
    }
}

// AFTER — shared base struct via composition
struct EmployeeInfo {
    name: String,
    id: String,
    salary: f64,
}

impl EmployeeInfo {
    fn new(name: &str, id: &str, salary: f64) -> Self {
        Self { name: name.into(), id: id.into(), salary }
    }
}

struct Manager { info: EmployeeInfo, department: String }

impl Manager {
    fn new(name: &str, id: &str, salary: f64, department: &str) -> Self {
        Self { info: EmployeeInfo::new(name, id, salary), department: department.into() }
    }
}

struct Engineer { info: EmployeeInfo, language: String }

impl Engineer {
    fn new(name: &str, id: &str, salary: f64, language: &str) -> Self {
        Self { info: EmployeeInfo::new(name, id, salary), language: language.into() }
    }
}
```

## Language Notes

- **Go**: No constructors or `super()` calls. Use struct embedding with a shared base struct and a helper function (e.g., `newEmployeeBase(...)`) that all factory functions call to initialize the common fields.
- **Rust**: No constructors or `super()` calls. Use a shared inner struct (composition) with its own `::new()` associated function. Each outer struct's constructor delegates shared initialization to the inner struct.

## Related Smells

Duplicated Code

## Inverse

(none)
