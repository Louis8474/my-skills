# Change Reference to Value

**Category:** Organizing Data
**Sources:** Fowler Ch.7, Shvets Ch.7

## Problem

A small object is treated as a shared mutable reference when it could be an immutable value. Shared references require careful coordination — any code holding a reference can mutate it, causing spooky action at a distance. For small, conceptually simple objects, this complexity is unnecessary.

## Motivation

Value objects are simpler to reason about: they are immutable, compared by their contents (not identity), and safe to share freely. When you replace a reference with a value, you eliminate mutation bugs and make the object safe for use as hash keys, cache entries, and concurrent access.

## When to Apply

- Object is small and conceptually a "value" (money, date range, color, coordinate)
- You don't need shared identity — two objects with the same data are interchangeable
- Mutation of the object causes bugs because multiple holders see the change
- Object would benefit from being a hash/dict key or set member

## Mechanics

1. Make the object immutable (remove setters, use `frozen=True`, `readonly`, etc.)
2. Implement value equality (override `__eq__`/`__hash__`, `equals`/`hashCode`, `PartialEq`/`Eq`)
3. Replace any mutation with creation of a new instance
4. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE — mutable reference, shared between objects
class Money:
    def __init__(self, amount: float, currency: str):
        self.amount = amount
        self.currency = currency

    def add(self, other: "Money"):
        assert self.currency == other.currency
        self.amount += other.amount  # mutates in place — affects all holders

price = Money(100, "USD")
tax = price  # shares the same object
tax.add(Money(10, "USD"))
# price.amount is now 110 — unintended!

# AFTER — immutable value object
from dataclasses import dataclass

@dataclass(frozen=True)
class Money:
    amount: float
    currency: str

    def add(self, other: "Money") -> "Money":
        assert self.currency == other.currency
        return Money(self.amount + other.amount, self.currency)

price = Money(100, "USD")
tax = price.add(Money(10, "USD"))
# price.amount is still 100 — safe
```

### TypeScript

```typescript
// BEFORE — mutable reference
class Money {
  constructor(public amount: number, public currency: string) {}

  add(other: Money): void {
    this.amount += other.amount; // mutation
  }
}

// AFTER — immutable value
class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {}

  add(other: Money): Money {
    return new Money(this.amount + other.amount, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
```

### Go

```go
// BEFORE — pointer (reference semantics), mutable
type Money struct {
	Amount   float64
	Currency string
}

func (m *Money) Add(other *Money) {
	m.Amount += other.Amount // mutates the receiver
}

// AFTER — value semantics, returns new value
type Money struct {
	Amount   float64
	Currency string
}

func (m Money) Add(other Money) Money {
	return Money{
		Amount:   m.Amount + other.Amount,
		Currency: m.Currency,
	}
}

// Comparison works automatically with == for structs with comparable fields
```

### Rust

```rust
// BEFORE — mutable, passed by &mut
#[derive(Debug, Clone)]
struct Money {
    amount: f64,
    currency: String,
}

impl Money {
    fn add(&mut self, other: &Money) {
        self.amount += other.amount; // mutates in place
    }
}

// AFTER — immutable value, returns new instance
#[derive(Debug, Clone, PartialEq)]
struct Money {
    amount: f64,
    currency: String,
}

impl Money {
    fn add(&self, other: &Money) -> Money {
        Money {
            amount: self.amount + other.amount,
            currency: self.currency.clone(),
        }
    }
}
```

## Related Smells

Mutable Data

## Inverse

Change Value to Reference (#26)
