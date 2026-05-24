# Move Field

**Category:** Moving Features
**Sources:** Fowler Ch.7-8, Shvets Ch.7

## Problem

A field is used more by another type than its own. It is always accessed through or in the context of another object, suggesting it conceptually belongs there.

## Motivation

Data and behavior should be co-located. When a field is primarily read or written by another type, it creates unnecessary coupling — the type that owns the field becomes a mere data holder for someone else's logic. Moving the field to where it is actually used improves cohesion and reduces cross-type dependencies.

## When to Apply

- A field is always accessed through another object's reference
- A field is conceptually part of another type's domain
- Multiple methods in another type reference this field
- Moving the field would eliminate a dependency between types

## Mechanics

1. Encapsulate the field if it is public (use getter/setter first)
2. Create the field in the target type
3. Update all references to point to the new location
4. Remove the old field
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Customer:
    def __init__(self, name: str, discount_rate: float, plan: "BillingPlan"):
        self.name = name
        self.discount_rate = discount_rate
        self.plan = plan

class BillingPlan:
    def __init__(self, base_rate: float):
        self.base_rate = base_rate

    def calculate_charge(self, customer: "Customer", usage: float) -> float:
        return usage * self.base_rate * (1 - customer.discount_rate)

# AFTER
class Customer:
    def __init__(self, name: str, plan: "BillingPlan"):
        self.name = name
        self.plan = plan

class BillingPlan:
    def __init__(self, base_rate: float, discount_rate: float):
        self.base_rate = base_rate
        self.discount_rate = discount_rate

    def calculate_charge(self, usage: float) -> float:
        return usage * self.base_rate * (1 - self.discount_rate)
```

### TypeScript

```typescript
// BEFORE
class Customer {
  constructor(
    public name: string,
    public discountRate: number,
    public plan: BillingPlan
  ) {}
}

class BillingPlan {
  constructor(public baseRate: number) {}

  calculateCharge(customer: Customer, usage: number): number {
    return usage * this.baseRate * (1 - customer.discountRate);
  }
}

// AFTER
class Customer {
  constructor(public name: string, public plan: BillingPlan) {}
}

class BillingPlan {
  constructor(public baseRate: number, public discountRate: number) {}

  calculateCharge(usage: number): number {
    return usage * this.baseRate * (1 - this.discountRate);
  }
}
```

### Go

```go
// BEFORE
type Customer struct {
	Name         string
	DiscountRate float64
	Plan         *BillingPlan
}

type BillingPlan struct {
	BaseRate float64
}

func (bp *BillingPlan) CalculateCharge(customer *Customer, usage float64) float64 {
	return usage * bp.BaseRate * (1 - customer.DiscountRate)
}

// AFTER
type Customer struct {
	Name string
	Plan *BillingPlan
}

type BillingPlan struct {
	BaseRate     float64
	DiscountRate float64
}

func (bp *BillingPlan) CalculateCharge(usage float64) float64 {
	return usage * bp.BaseRate * (1 - bp.DiscountRate)
}
```

### Rust

```rust
// BEFORE
struct Customer {
    name: String,
    discount_rate: f64,
    plan: BillingPlan,
}

struct BillingPlan {
    base_rate: f64,
}

impl BillingPlan {
    fn calculate_charge(&self, customer: &Customer, usage: f64) -> f64 {
        usage * self.base_rate * (1.0 - customer.discount_rate)
    }
}

// AFTER
struct Customer {
    name: String,
    plan: BillingPlan,
}

struct BillingPlan {
    base_rate: f64,
    discount_rate: f64,
}

impl BillingPlan {
    fn calculate_charge(&self, usage: f64) -> f64 {
        usage * self.base_rate * (1.0 - self.discount_rate)
    }
}
```

## Related Smells

Feature Envy, Data Clumps

## Inverse

(none)
