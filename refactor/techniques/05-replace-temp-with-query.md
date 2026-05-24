# Replace Temp with Query

**Category:** Composing Methods
**Sources:** Fowler Ch.6, Shvets Ch.6

## Problem

A temporary variable holds the result of an expression and is used in multiple places within the function. This temp makes it harder to extract parts of the function because the temp's scope ties logic together.

## Motivation

Replacing a temporary variable with a query (a function call) removes a barrier to further refactoring. Once the calculation is in its own function, it becomes reusable and independently testable. Other methods in the class can also call the query instead of duplicating the calculation.

## When to Apply

- A temp is assigned once and referenced in later calculations
- The temp's name adds meaning, but a function would add more (reusability, testability)
- You want to extract methods but the temp is blocking you
- The expression has no side effects and can be called multiple times safely

## Mechanics

1. Extract the right-hand side of the temp assignment into its own function
2. Replace all references to the temp with calls to the new function
3. Remove the temp declaration and assignment
4. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Order:
    def __init__(self, quantity: int, item_price: float):
        self.quantity = quantity
        self.item_price = item_price

    def calculate_total(self) -> float:
        base_price = self.quantity * self.item_price
        if base_price > 1000:
            return base_price * 0.95
        return base_price * 0.98

# AFTER
class Order:
    def __init__(self, quantity: int, item_price: float):
        self.quantity = quantity
        self.item_price = item_price

    @property
    def base_price(self) -> float:
        return self.quantity * self.item_price

    def calculate_total(self) -> float:
        if self.base_price > 1000:
            return self.base_price * 0.95
        return self.base_price * 0.98
```

### TypeScript

```typescript
// BEFORE
class Order {
  constructor(private quantity: number, private itemPrice: number) {}

  calculateTotal(): number {
    const basePrice = this.quantity * this.itemPrice;
    if (basePrice > 1000) {
      return basePrice * 0.95;
    }
    return basePrice * 0.98;
  }
}

// AFTER
class Order {
  constructor(private quantity: number, private itemPrice: number) {}

  get basePrice(): number {
    return this.quantity * this.itemPrice;
  }

  calculateTotal(): number {
    if (this.basePrice > 1000) {
      return this.basePrice * 0.95;
    }
    return this.basePrice * 0.98;
  }
}
```

### Go

```go
// BEFORE
type Order struct {
	Quantity  int
	ItemPrice float64
}

func (o Order) CalculateTotal() float64 {
	basePrice := float64(o.Quantity) * o.ItemPrice
	if basePrice > 1000 {
		return basePrice * 0.95
	}
	return basePrice * 0.98
}

// AFTER
type Order struct {
	Quantity  int
	ItemPrice float64
}

func (o Order) BasePrice() float64 {
	return float64(o.Quantity) * o.ItemPrice
}

func (o Order) CalculateTotal() float64 {
	if o.BasePrice() > 1000 {
		return o.BasePrice() * 0.95
	}
	return o.BasePrice() * 0.98
}
```

### Rust

```rust
// BEFORE
struct Order {
    quantity: u32,
    item_price: f64,
}

impl Order {
    fn calculate_total(&self) -> f64 {
        let base_price = self.quantity as f64 * self.item_price;
        if base_price > 1000.0 {
            base_price * 0.95
        } else {
            base_price * 0.98
        }
    }
}

// AFTER
struct Order {
    quantity: u32,
    item_price: f64,
}

impl Order {
    fn base_price(&self) -> f64 {
        self.quantity as f64 * self.item_price
    }

    fn calculate_total(&self) -> f64 {
        if self.base_price() > 1000.0 {
            self.base_price() * 0.95
        } else {
            self.base_price() * 0.98
        }
    }
}
```

## Related Smells

Long Method

## Inverse

(none)
