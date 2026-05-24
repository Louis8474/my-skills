# Push Down Method / Push Down Field

**Category:** Dealing with Generalization
**Sources:** Fowler Ch.12, Shvets Ch.11

## Problem

A method in a parent or base type is only relevant to one specific subtype. The method clutters the parent's interface and misleads callers into thinking all subtypes support the behavior.

## Motivation

When a method in a parent class is only used by one subtype, it belongs in that subtype. Keeping it in the parent violates the principle that a base class should only contain behavior shared by all subtypes. Pushing it down clarifies the design and reduces the parent's surface area.

## When to Apply

- A method in the parent is only meaningful for one subtype
- The method throws "not supported" in most subtypes
- The behavior is not truly shared — it was speculatively placed in the parent
- You are narrowing a hierarchy to reduce complexity

## Mechanics

1. Identify the method that is only relevant to one (or a few) subtypes
2. Move the method to the specific subtype(s) that use it
3. Remove the method from the parent
4. Update callers to use the specific subtype reference if needed
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Employee:
    def __init__(self, name: str, salary: float):
        self.name = name
        self.salary = salary

    def quota(self) -> float:
        raise NotImplementedError("Only sales reps have quotas")

class Engineer(Employee):
    pass

class SalesRep(Employee):
    def __init__(self, name: str, salary: float, quota: float):
        super().__init__(name, salary)
        self._quota = quota

    def quota(self) -> float:
        return self._quota

# AFTER
class Employee:
    def __init__(self, name: str, salary: float):
        self.name = name
        self.salary = salary

class Engineer(Employee):
    pass

class SalesRep(Employee):
    def __init__(self, name: str, salary: float, quota: float):
        super().__init__(name, salary)
        self._quota = quota

    def quota(self) -> float:
        return self._quota
```

### TypeScript

```typescript
// BEFORE
abstract class Employee {
  constructor(public name: string, public salary: number) {}
  quota(): number { throw new Error("Only sales reps have quotas"); }
}

class Engineer extends Employee {}

class SalesRep extends Employee {
  constructor(name: string, salary: number, private _quota: number) {
    super(name, salary);
  }
  quota(): number { return this._quota; }
}

// AFTER
abstract class Employee {
  constructor(public name: string, public salary: number) {}
  // quota() removed — not shared behavior
}

class Engineer extends Employee {}

class SalesRep extends Employee {
  constructor(name: string, salary: number, private _quota: number) {
    super(name, salary);
  }
  quota(): number { return this._quota; }
}
```

### Go

```go
// BEFORE — Quota on the embedded base struct
type employeeBase struct {
	Name   string
	Salary float64
}

func (b *employeeBase) Quota() float64 {
	panic("only sales reps have quotas")
}

type Engineer struct{ employeeBase }
type SalesRep struct {
	employeeBase
	quota float64
}

// AFTER — Quota only on SalesRep
type employeeBase struct {
	Name   string
	Salary float64
}

type Engineer struct{ employeeBase }

type SalesRep struct {
	employeeBase
	quota float64
}

func (s *SalesRep) Quota() float64 { return s.quota }
```

### Rust

```rust
// BEFORE — trait with a default that panics for most types
trait Employee {
    fn name(&self) -> &str;
    fn salary(&self) -> f64;
    fn quota(&self) -> f64 { panic!("only sales reps have quotas") }
}

struct Engineer { name: String, salary: f64 }
impl Employee for Engineer {
    fn name(&self) -> &str { &self.name }
    fn salary(&self) -> f64 { self.salary }
}

// AFTER — quota is NOT part of the shared trait
trait Employee {
    fn name(&self) -> &str;
    fn salary(&self) -> f64;
}

struct Engineer { name: String, salary: f64 }
impl Employee for Engineer {
    fn name(&self) -> &str { &self.name }
    fn salary(&self) -> f64 { self.salary }
}

struct SalesRep { name: String, salary: f64, quota: f64 }
impl Employee for SalesRep {
    fn name(&self) -> &str { &self.name }
    fn salary(&self) -> f64 { self.salary }
}
impl SalesRep {
    fn quota(&self) -> f64 { self.quota }
}
```

## Language Notes

- **Go**: Remove the method from the embedded base struct and add it only to the specific struct that needs it. Other structs no longer promote a method they don't support.
- **Rust**: Remove the default implementation from the trait. Add the method as an inherent `impl` on the specific struct, keeping the shared trait lean.

## Related Smells

Speculative Generality, Refused Bequest

## Inverse

Pull Up Method (#46)
