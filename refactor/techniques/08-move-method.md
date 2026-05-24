# Move Method / Move Function

**Category:** Moving Features
**Sources:** Fowler Ch.7-8, Shvets Ch.7
**Also known as:** Move Function

## Problem

A function uses more features of another class or struct than its own. It accesses another object's data extensively while barely touching its own state — a classic case of Feature Envy.

## Motivation

A function should live close to the data it uses most. When a method primarily operates on another type's data, moving it to that type improves cohesion, reduces coupling, and makes the code easier to understand. The original type becomes simpler, and the target type becomes more self-contained.

## When to Apply

- A function accesses data from another type more than its own
- A function does not use `self`/`this` data at all
- A function is always called together with the data of another type
- Moving the function would reduce parameter passing

## Mechanics

1. Examine all features used by the function in its current context
2. Check if sub/superclasses also declare this method (polymorphism concerns)
3. Move the function to the target type
4. Make the old function delegate to the new location, or remove it and update all callers
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Customer:
    def __init__(self, name: str, contract: "Contract"):
        self.name = name
        self.contract = contract

    def get_discount_amount(self, order: "Order") -> float:
        return order.total * self.contract.discount_rate

class Order:
    def __init__(self, total: float):
        self.total = total

# AFTER
class Customer:
    def __init__(self, name: str, contract: "Contract"):
        self.name = name
        self.contract = contract

class Order:
    def __init__(self, total: float):
        self.total = total

    def get_discount_amount(self, contract: "Contract") -> float:
        return self.total * contract.discount_rate
```

### TypeScript

```typescript
// BEFORE
class Customer {
  constructor(public name: string, public contract: Contract) {}

  getDiscountAmount(order: Order): number {
    return order.total * this.contract.discountRate;
  }
}

class Order {
  constructor(public total: number) {}
}

// AFTER
class Customer {
  constructor(public name: string, public contract: Contract) {}
}

class Order {
  constructor(public total: number) {}

  getDiscountAmount(contract: Contract): number {
    return this.total * contract.discountRate;
  }
}
```

### Go

```go
// BEFORE
type Customer struct {
	Name     string
	Contract *Contract
}

func (c *Customer) GetDiscountAmount(order *Order) float64 {
	return order.Total * c.Contract.DiscountRate
}

type Order struct {
	Total float64
}

// AFTER
type Customer struct {
	Name     string
	Contract *Contract
}

type Order struct {
	Total float64
}

func (o *Order) GetDiscountAmount(contract *Contract) float64 {
	return o.Total * contract.DiscountRate
}
```

### Rust

```rust
// BEFORE
struct Customer {
    name: String,
    contract: Contract,
}

impl Customer {
    fn get_discount_amount(&self, order: &Order) -> f64 {
        order.total * self.contract.discount_rate
    }
}

struct Order {
    total: f64,
}

// AFTER
struct Customer {
    name: String,
    contract: Contract,
}

struct Order {
    total: f64,
}

impl Order {
    fn get_discount_amount(&self, contract: &Contract) -> f64 {
        self.total * contract.discount_rate
    }
}
```

## Related Smells

Feature Envy, Inappropriate Intimacy

## Inverse

(none)
