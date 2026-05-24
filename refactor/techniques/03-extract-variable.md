# Extract Variable / Introduce Explaining Variable

**Category:** Composing Methods
**Sources:** Fowler Ch.6, Shvets Ch.6
**Also known as:** Introduce Explaining Variable

## Problem

A complex expression is hard to understand at a glance. The reader must mentally parse operators, precedence, and nested calls to understand what the expression computes.

## Motivation

Named variables act as inline documentation. Breaking a complex expression into well-named intermediate variables makes the code self-documenting and easier to debug (you can inspect each part). This is especially valuable in conditionals and arithmetic formulas.

## When to Apply

- A long boolean expression combines multiple conditions
- An arithmetic formula mixes several terms (base, discount, shipping, tax)
- A complex condition appears in an `if` statement and is hard to read
- You need to debug parts of an expression independently

## Mechanics

1. Create a named variable with a descriptive name
2. Assign the complex sub-expression to it
3. Replace all occurrences of that sub-expression with the variable
4. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def calculate_price(order):
    return (
        order.quantity * order.item_price
        - max(0, order.quantity - 500) * order.item_price * 0.05
        + min(order.quantity * order.item_price * 0.1, 100.0)
    )

# AFTER
def calculate_price(order):
    base_price = order.quantity * order.item_price
    quantity_discount = max(0, order.quantity - 500) * order.item_price * 0.05
    shipping = min(base_price * 0.1, 100.0)
    return base_price - quantity_discount + shipping
```

### TypeScript

```typescript
// BEFORE
function calculatePrice(order: Order): number {
  return (
    order.quantity * order.itemPrice -
    Math.max(0, order.quantity - 500) * order.itemPrice * 0.05 +
    Math.min(order.quantity * order.itemPrice * 0.1, 100.0)
  );
}

// AFTER
function calculatePrice(order: Order): number {
  const basePrice = order.quantity * order.itemPrice;
  const quantityDiscount = Math.max(0, order.quantity - 500) * order.itemPrice * 0.05;
  const shipping = Math.min(basePrice * 0.1, 100.0);
  return basePrice - quantityDiscount + shipping;
}
```

### Go

```go
// BEFORE
func CalculatePrice(order Order) float64 {
	return float64(order.Quantity)*order.ItemPrice -
		math.Max(0, float64(order.Quantity-500))*order.ItemPrice*0.05 +
		math.Min(float64(order.Quantity)*order.ItemPrice*0.1, 100.0)
}

// AFTER
func CalculatePrice(order Order) float64 {
	basePrice := float64(order.Quantity) * order.ItemPrice
	quantityDiscount := math.Max(0, float64(order.Quantity-500)) * order.ItemPrice * 0.05
	shipping := math.Min(basePrice*0.1, 100.0)
	return basePrice - quantityDiscount + shipping
}
```

### Rust

```rust
// BEFORE
fn calculate_price(order: &Order) -> f64 {
    order.quantity as f64 * order.item_price
        - (order.quantity as i64 - 500).max(0) as f64 * order.item_price * 0.05
        + (order.quantity as f64 * order.item_price * 0.1).min(100.0)
}

// AFTER
fn calculate_price(order: &Order) -> f64 {
    let base_price = order.quantity as f64 * order.item_price;
    let quantity_discount = (order.quantity as i64 - 500).max(0) as f64 * order.item_price * 0.05;
    let shipping = (base_price * 0.1).min(100.0);
    base_price - quantity_discount + shipping
}
```

## Related Smells

Long Method, Comments

## Inverse

Inline Variable (#04)
