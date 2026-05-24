# Replace Parameter with Query

**Category:** Simplifying Method Calls
**Sources:** Fowler Ch.6

## Problem

A parameter's value can always be determined from information already available to the function. The caller is forced to compute and pass a value that the function could derive on its own, adding unnecessary coupling and cognitive load at every call site.

## Motivation

Removing a parameter that the function can compute itself simplifies the API. Each call site becomes shorter and less error-prone — callers can't accidentally pass the wrong derived value. The function becomes more self-contained and its interface more focused.

## When to Apply

- The function already has access to the data needed to compute the parameter's value
- Every caller computes the parameter the same way
- The derived value is always consistent with the function's other inputs
- Removing the parameter doesn't introduce a dependency you want to avoid

## Mechanics

1. Verify the parameter's value can be computed from the function's other parameters or fields
2. Compute the value inside the function body
3. Remove the parameter from the function signature
4. Update all callers (they'll be simpler — they no longer need to compute the value)
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Order:
    def __init__(self, quantity: int, item_price: float):
        self.quantity = quantity
        self.item_price = item_price

    def base_price(self) -> float:
        return self.quantity * self.item_price

    def discount(self, base_price: float, is_premium: bool) -> float:
        multiplier = 0.10 if is_premium else 0.05
        return base_price * multiplier if base_price > 1000 else 0

# Caller must compute base_price and is_premium
bp = order.base_price()
disc = order.discount(bp, customer.is_premium(order))  # redundant — order knows its own base_price

# AFTER
class Order:
    def __init__(self, quantity: int, item_price: float, customer: Customer):
        self.quantity = quantity
        self.item_price = item_price
        self.customer = customer

    def base_price(self) -> float:
        return self.quantity * self.item_price

    def discount(self) -> float:
        multiplier = 0.10 if self.customer.is_premium else 0.05
        return self.base_price() * multiplier if self.base_price() > 1000 else 0

# Caller is simpler
disc = order.discount()
```

### TypeScript

```typescript
// BEFORE
class Order {
  constructor(
    public quantity: number,
    public itemPrice: number
  ) {}

  basePrice(): number {
    return this.quantity * this.itemPrice;
  }

  discount(basePrice: number): number {
    return basePrice > 1000 ? basePrice * 0.05 : 0;
  }
}

// Every caller computes basePrice the same way
const disc = order.discount(order.basePrice());

// AFTER
class Order {
  constructor(
    public quantity: number,
    public itemPrice: number
  ) {}

  basePrice(): number {
    return this.quantity * this.itemPrice;
  }

  discount(): number {
    const bp = this.basePrice();
    return bp > 1000 ? bp * 0.05 : 0;
  }
}

// Caller is simpler
const disc = order.discount();
```

### Go

```go
// BEFORE
func (o Order) BasePrice() float64 {
	return float64(o.Quantity) * o.ItemPrice
}

func (o Order) Discount(basePrice float64) float64 {
	if basePrice > 1000 {
		return basePrice * 0.05
	}
	return 0
}

// Caller
bp := order.BasePrice()
disc := order.Discount(bp)

// AFTER
func (o Order) BasePrice() float64 {
	return float64(o.Quantity) * o.ItemPrice
}

func (o Order) Discount() float64 {
	bp := o.BasePrice()
	if bp > 1000 {
		return bp * 0.05
	}
	return 0
}

// Caller
disc := order.Discount()
```

### Rust

```rust
// BEFORE
impl Order {
    fn base_price(&self) -> f64 {
        self.quantity as f64 * self.item_price
    }

    fn discount(&self, base_price: f64) -> f64 {
        if base_price > 1000.0 { base_price * 0.05 } else { 0.0 }
    }
}

// Caller
let bp = order.base_price();
let disc = order.discount(bp);

// AFTER
impl Order {
    fn base_price(&self) -> f64 {
        self.quantity as f64 * self.item_price
    }

    fn discount(&self) -> f64 {
        let bp = self.base_price();
        if bp > 1000.0 { bp * 0.05 } else { 0.0 }
    }
}

// Caller
let disc = order.discount();
```

## Related Smells

Long Parameter List

## Inverse

Replace Query with Parameter (#41)
