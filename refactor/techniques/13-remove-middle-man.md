# Remove Middle Man

**Category:** Moving Features
**Sources:** Fowler Ch.7-8, Shvets Ch.7

## Problem

A class has too many delegating methods. Every time a new feature is added to the delegate, another forwarding method must be added to the middle man. The class becomes a thin, mindless wrapper that just passes everything through.

## Motivation

Hide Delegate is valuable, but it can be overdone. If a server class grows a forest of forwarding methods that just delegate to the same internal object, the server is no longer adding value — it is just getting in the way. In that case, let the client talk to the delegate directly and remove the forwarding clutter.

## When to Apply

- A class mostly consists of delegating methods
- Adding every new delegate feature requires a new forwarding method on the server
- The server has become a pure pass-through with no logic of its own
- You find yourself adding `get_x`, `get_y`, `get_z` that all forward to the same object

## Mechanics

1. Create an accessor (getter) for the delegate on the server
2. Update clients to access the delegate directly through the accessor
3. Remove the forwarding methods from the server
4. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Person:
    def __init__(self, name: str, department: "Department"):
        self.name = name
        self._department = department

    @property
    def manager(self) -> "Employee":
        return self._department.manager

    @property
    def department_name(self) -> str:
        return self._department.name

    @property
    def department_code(self) -> str:
        return self._department.code

    @property
    def department_budget(self) -> float:
        return self._department.budget

# AFTER
class Person:
    def __init__(self, name: str, department: "Department"):
        self.name = name
        self.department = department

# Client code:
manager = person.department.manager
budget = person.department.budget
```

### TypeScript

```typescript
// BEFORE
class Person {
  constructor(public name: string, private _department: Department) {}

  get manager(): Employee { return this._department.manager; }
  get departmentName(): string { return this._department.name; }
  get departmentCode(): string { return this._department.code; }
  get departmentBudget(): number { return this._department.budget; }
}

// AFTER
class Person {
  constructor(public name: string, public department: Department) {}
}

// Client code:
const manager = person.department.manager;
const budget = person.department.budget;
```

### Go

```go
// BEFORE
type Person struct {
	Name       string
	department *Department
}

func (p *Person) Manager() *Employee    { return p.department.Manager }
func (p *Person) DepartmentName() string { return p.department.Name }
func (p *Person) DepartmentCode() string { return p.department.Code }
func (p *Person) DepartmentBudget() float64 { return p.department.Budget }

// AFTER
type Person struct {
	Name       string
	Department *Department
}

// Client code:
// manager := person.Department.Manager
// budget := person.Department.Budget
```

### Rust

```rust
// BEFORE
struct Person {
    name: String,
    department: Department,
}

impl Person {
    fn manager(&self) -> &Employee { &self.department.manager }
    fn department_name(&self) -> &str { &self.department.name }
    fn department_code(&self) -> &str { &self.department.code }
    fn department_budget(&self) -> f64 { self.department.budget }
}

// AFTER
struct Person {
    name: String,
    department: Department,
}

impl Person {
    fn department(&self) -> &Department { &self.department }
}

// Client code:
// let manager = person.department().manager();
// let budget = person.department().budget;
```

## Related Smells

Middle Man

## Inverse

Hide Delegate (#12)
