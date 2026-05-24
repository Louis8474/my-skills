# Separate Query from Modifier (CQS)

**Category:** Simplifying Method Calls
**Sources:** Fowler Ch.6, Shvets Ch.10
**Also known as:** Command-Query Separation

## Problem

A function both returns a value AND changes state. The side effect is hidden inside what looks like a query, so callers who only want the value inadvertently trigger mutations. This violates the Command-Query Separation (CQS) principle.

## Motivation

When a function that appears to be a query also modifies state, callers cannot safely call it multiple times or use it in assertions without side effects. Splitting into a pure query (returns a value, no side effects) and a separate command (changes state, returns nothing) makes the code predictable and easier to test.

## When to Apply

- A function named like a getter modifies state as a side effect
- Callers need the value without triggering the mutation
- The function is hard to test because queries and mutations are entangled
- You need to call the query multiple times without doubling the side effect

## Mechanics

1. Create a query function that returns the value without side effects
2. Create a modifier function that changes state without returning a value
3. Replace all callers: call the query for the value, call the modifier for the mutation
4. If some callers need both, call modifier first, then query (or vice versa as needed)
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class ShoppingCart:
    def __init__(self, items: list[float]):
        self.items = items
        self._discount_applied = False

    def get_total_and_apply_discount(self, rate: float) -> float:
        total = sum(self.items)
        if not self._discount_applied:
            self.items = [price * (1 - rate) for price in self.items]
            self._discount_applied = True
        return total  # returns old total, mutates items — confusing

# AFTER
class ShoppingCart:
    def __init__(self, items: list[float]):
        self.items = items
        self._discount_applied = False

    def total(self) -> float:
        return sum(self.items)

    def apply_discount(self, rate: float) -> None:
        if not self._discount_applied:
            self.items = [price * (1 - rate) for price in self.items]
            self._discount_applied = True

# Caller:
# cart.apply_discount(0.1)
# print(cart.total())
```

### TypeScript

```typescript
// BEFORE
class ShoppingCart {
  private discountApplied = false;

  constructor(private items: number[]) {}

  getTotalAndApplyDiscount(rate: number): number {
    const total = this.items.reduce((sum, p) => sum + p, 0);
    if (!this.discountApplied) {
      this.items = this.items.map(p => p * (1 - rate));
      this.discountApplied = true;
    }
    return total;
  }
}

// AFTER
class ShoppingCart {
  private discountApplied = false;

  constructor(private items: number[]) {}

  total(): number {
    return this.items.reduce((sum, p) => sum + p, 0);
  }

  applyDiscount(rate: number): void {
    if (!this.discountApplied) {
      this.items = this.items.map(p => p * (1 - rate));
      this.discountApplied = true;
    }
  }
}

// Caller:
// cart.applyDiscount(0.1);
// console.log(cart.total());
```

### Go

```go
// BEFORE
type ShoppingCart struct {
	Items           []float64
	discountApplied bool
}

func (c *ShoppingCart) GetTotalAndApplyDiscount(rate float64) float64 {
	total := 0.0
	for _, p := range c.Items {
		total += p
	}
	if !c.discountApplied {
		for i, p := range c.Items {
			c.Items[i] = p * (1 - rate)
		}
		c.discountApplied = true
	}
	return total
}

// AFTER
type ShoppingCart struct {
	Items           []float64
	discountApplied bool
}

func (c *ShoppingCart) Total() float64 {
	total := 0.0
	for _, p := range c.Items {
		total += p
	}
	return total
}

func (c *ShoppingCart) ApplyDiscount(rate float64) {
	if !c.discountApplied {
		for i, p := range c.Items {
			c.Items[i] = p * (1 - rate)
		}
		c.discountApplied = true
	}
}
```

### Rust

```rust
// BEFORE
struct ShoppingCart {
    items: Vec<f64>,
    discount_applied: bool,
}

impl ShoppingCart {
    fn get_total_and_apply_discount(&mut self, rate: f64) -> f64 {
        let total: f64 = self.items.iter().sum();
        if !self.discount_applied {
            self.items.iter_mut().for_each(|p| *p *= 1.0 - rate);
            self.discount_applied = true;
        }
        total
    }
}

// AFTER
struct ShoppingCart {
    items: Vec<f64>,
    discount_applied: bool,
}

impl ShoppingCart {
    fn total(&self) -> f64 {
        self.items.iter().sum()
    }

    fn apply_discount(&mut self, rate: f64) {
        if !self.discount_applied {
            self.items.iter_mut().for_each(|p| *p *= 1.0 - rate);
            self.discount_applied = true;
        }
    }
}

// Caller:
// cart.apply_discount(0.1);
// let t = cart.total();
```

## Related Smells

(CQS principle, Side Effects)

## Inverse

(none)
