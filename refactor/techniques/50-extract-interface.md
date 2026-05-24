# Extract Interface / Extract Trait

**Category:** Dealing with Generalization
**Sources:** Fowler Ch.12, Shvets Ch.11

## Problem

Multiple types share a common subset of methods, but there is no shared contract. Client code depends on concrete types when it only uses a few of their methods, creating unnecessary coupling.

## Motivation

When a client only needs a subset of a type's methods, defining an interface (or trait) for that subset decouples the client from the concrete type. This enables substitution, testing with mocks, and adding new implementations without modifying clients. The interface captures the role the client expects, not the full capability of the type.

## When to Apply

- A client uses only a subset of a type's methods
- Multiple types share methods that clients use polymorphically
- You want to decouple a module from a concrete dependency
- You need to introduce a mock or stub for testing

## Mechanics

1. Identify the subset of methods the client depends on
2. Create an interface (or trait) with those method signatures
3. Have the concrete types implement the interface
4. Change the client to depend on the interface, not the concrete type
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Consultant:
    def __init__(self, name: str, rate: float):
        self.name = name
        self.rate = rate

    def get_rate(self) -> float:
        return self.rate

    def has_special_skill(self, skill: str) -> bool:
        return skill in self._skills

class Employee:
    def __init__(self, name: str, salary: float):
        self.name = name
        self.salary = salary

    def get_rate(self) -> float:
        return self.salary / 2080

    def has_special_skill(self, skill: str) -> bool:
        return skill in self._certifications

# Client is coupled to concrete types
def estimate_cost(worker, hours: int) -> float:
    return worker.get_rate() * hours

# AFTER
from typing import Protocol

class Billable(Protocol):
    def get_rate(self) -> float: ...
    def has_special_skill(self, skill: str) -> bool: ...

class Consultant:
    def __init__(self, name: str, rate: float):
        self.name = name
        self.rate = rate
        self._skills: set[str] = set()

    def get_rate(self) -> float:
        return self.rate

    def has_special_skill(self, skill: str) -> bool:
        return skill in self._skills

class Employee:
    def __init__(self, name: str, salary: float):
        self.name = name
        self.salary = salary
        self._certifications: set[str] = set()

    def get_rate(self) -> float:
        return self.salary / 2080

    def has_special_skill(self, skill: str) -> bool:
        return skill in self._certifications

def estimate_cost(worker: Billable, hours: int) -> float:
    return worker.get_rate() * hours
```

### TypeScript

```typescript
// BEFORE
class Consultant {
  constructor(public name: string, private rate: number) {}
  getRate(): number { return this.rate; }
  hasSpecialSkill(skill: string): boolean { return this.skills.has(skill); }
  private skills = new Set<string>();
}

class Employee {
  constructor(public name: string, private salary: number) {}
  getRate(): number { return this.salary / 2080; }
  hasSpecialSkill(skill: string): boolean { return this.certs.has(skill); }
  private certs = new Set<string>();
}

// AFTER
interface Billable {
  getRate(): number;
  hasSpecialSkill(skill: string): boolean;
}

class Consultant implements Billable {
  private skills = new Set<string>();
  constructor(public name: string, private rate: number) {}
  getRate(): number { return this.rate; }
  hasSpecialSkill(skill: string): boolean { return this.skills.has(skill); }
}

class Employee implements Billable {
  private certs = new Set<string>();
  constructor(public name: string, private salary: number) {}
  getRate(): number { return this.salary / 2080; }
  hasSpecialSkill(skill: string): boolean { return this.certs.has(skill); }
}

function estimateCost(worker: Billable, hours: number): number {
  return worker.getRate() * hours;
}
```

### Go

```go
// Go interfaces are implicit — just define the interface where the client needs it.

// BEFORE — client depends on concrete types
type Consultant struct {
	Name   string
	Rate   float64
	skills map[string]bool
}

func (c *Consultant) GetRate() float64              { return c.Rate }
func (c *Consultant) HasSpecialSkill(s string) bool { return c.skills[s] }

type Employee struct {
	Name   string
	Salary float64
	certs  map[string]bool
}

func (e *Employee) GetRate() float64              { return e.Salary / 2080 }
func (e *Employee) HasSpecialSkill(s string) bool { return e.certs[s] }

// AFTER — define the interface at the consumer side
type Billable interface {
	GetRate() float64
	HasSpecialSkill(skill string) bool
}

// Consultant and Employee implicitly satisfy Billable — no changes needed

func EstimateCost(worker Billable, hours int) float64 {
	return worker.GetRate() * float64(hours)
}
```

### Rust

```rust
// Rust: define a trait for the shared contract.

// BEFORE — no shared trait, client uses concrete types
struct Consultant { name: String, rate: f64 }

impl Consultant {
    fn get_rate(&self) -> f64 { self.rate }
}

struct Employee { name: String, salary: f64 }

impl Employee {
    fn get_rate(&self) -> f64 { self.salary / 2080.0 }
}

// AFTER — extract a trait
trait Billable {
    fn get_rate(&self) -> f64;
    fn has_special_skill(&self, skill: &str) -> bool;
}

impl Billable for Consultant {
    fn get_rate(&self) -> f64 { self.rate }
    fn has_special_skill(&self, skill: &str) -> bool { self.skills.contains(skill) }
}

impl Billable for Employee {
    fn get_rate(&self) -> f64 { self.salary / 2080.0 }
    fn has_special_skill(&self, skill: &str) -> bool { self.certs.contains(skill) }
}

fn estimate_cost(worker: &dyn Billable, hours: u32) -> f64 {
    worker.get_rate() * hours as f64
}
```

## Language Notes

- **Go**: Interfaces are implicit (structural typing) — the concrete types do not need to declare they implement the interface. Define the interface at the consumer side, following the Go proverb "accept interfaces, return structs."
- **Rust**: Traits must be explicitly implemented. Define the trait with the shared method signatures and implement it for each concrete type. Use `&dyn Trait` for dynamic dispatch or generics (`impl Trait`) for static dispatch.

## Related Smells

(decoupling, Liskov Substitution Principle)

## Inverse

(none)
