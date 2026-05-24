# Collapse Hierarchy

**Category:** Dealing with Generalization
**Sources:** Fowler Ch.12, Shvets Ch.11

## Problem

A parent and child type are too similar — the subtype adds almost nothing. The distinction does not justify the complexity of maintaining a separate class, and the hierarchy makes the code harder to navigate without adding real value.

## Motivation

Over time, refactoring may leave a hierarchy where the subtype barely differs from the parent. The extra level of indirection confuses readers and adds maintenance cost. Merging the subtype into the parent (or vice versa) simplifies the design and reduces the number of types to understand.

## When to Apply

- A subtype adds no new methods or fields (or only trivial ones)
- The hierarchy was created speculatively and never justified itself
- The subtype only overrides one method with minimal variation
- Removing the subtype would not lose meaningful behavior

## Mechanics

1. Identify which type to keep (usually the parent)
2. Move any subtype-specific fields or methods into the parent
3. Replace all references to the subtype with the parent type
4. Remove the subtype
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

    def annual_cost(self) -> float:
        return self.salary * 12

class SalesPerson(Employee):
    pass  # adds nothing meaningful

# AFTER
class Employee:
    def __init__(self, name: str, salary: float):
        self.name = name
        self.salary = salary

    def annual_cost(self) -> float:
        return self.salary * 12

# SalesPerson removed — use Employee directly
```

### TypeScript

```typescript
// BEFORE
class Employee {
  constructor(public name: string, public salary: number) {}
  annualCost(): number { return this.salary * 12; }
}

class SalesPerson extends Employee {
  // adds nothing
}

// AFTER
class Employee {
  constructor(public name: string, public salary: number) {}
  annualCost(): number { return this.salary * 12; }
}

// SalesPerson removed — use Employee directly
```

### Go

```go
// BEFORE — unnecessary embedding layer
type employeeBase struct {
	Name   string
	Salary float64
}

func (b *employeeBase) AnnualCost() float64 { return b.Salary * 12 }

type SalesPerson struct {
	employeeBase // adds nothing new
}

// AFTER — inline the embedded struct's fields
type Employee struct {
	Name   string
	Salary float64
}

func (e *Employee) AnnualCost() float64 { return e.Salary * 12 }

// SalesPerson removed — use Employee directly
```

### Rust

```rust
// BEFORE — unnecessary trait layer
trait Employee {
    fn name(&self) -> &str;
    fn salary(&self) -> f64;
    fn annual_cost(&self) -> f64 { self.salary() * 12.0 }
}

struct SalesPerson { name: String, salary: f64 }

impl Employee for SalesPerson {
    fn name(&self) -> &str { &self.name }
    fn salary(&self) -> f64 { self.salary }
    // annual_cost uses default — adds nothing
}

// AFTER — remove the trait layer, use a plain struct
struct Employee {
    name: String,
    salary: f64,
}

impl Employee {
    fn annual_cost(&self) -> f64 { self.salary * 12.0 }
}

// SalesPerson removed — use Employee directly
```

## Language Notes

- **Go**: When an outer struct adds nothing beyond the embedded struct, inline the embedded struct's fields into a single struct. Remove the embedding layer entirely.
- **Rust**: When a trait exists only for a single implementor and adds no polymorphic value, remove the trait and move the methods into an inherent `impl` on the concrete struct.

## Related Smells

Lazy Class, Speculative Generality

## Inverse

Extract Superclass (#49)
