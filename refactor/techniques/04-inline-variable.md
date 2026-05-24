# Inline Variable

**Category:** Composing Methods
**Sources:** Fowler Ch.6, Shvets Ch.6

## Problem

A variable name says no more than the expression it holds. The variable adds an unnecessary layer of indirection without improving readability.

## Motivation

Sometimes a variable is created out of habit rather than necessity. When the expression is already self-explanatory and the variable name adds no additional meaning, the variable just forces the reader to look in two places. Removing it makes the code more direct.

## When to Apply

- The variable is used only once
- The expression it holds is self-explanatory
- The variable name does not add clarity beyond what the expression already conveys
- The variable is getting in the way of another refactoring (like Extract Method)

## Mechanics

1. Verify the expression has no side effects (safe to inline)
2. Replace the variable reference with the expression directly
3. Remove the variable declaration
4. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def is_eligible(order):
    base_price = order.base_price
    return base_price > 1000

# AFTER
def is_eligible(order):
    return order.base_price > 1000
```

### TypeScript

```typescript
// BEFORE
function isEligible(order: Order): boolean {
  const basePrice = order.basePrice;
  return basePrice > 1000;
}

// AFTER
function isEligible(order: Order): boolean {
  return order.basePrice > 1000;
}
```

### Go

```go
// BEFORE
func IsEligible(order Order) bool {
	basePrice := order.BasePrice
	return basePrice > 1000
}

// AFTER
func IsEligible(order Order) bool {
	return order.BasePrice > 1000
}
```

### Rust

```rust
// BEFORE
fn is_eligible(order: &Order) -> bool {
    let base_price = order.base_price;
    base_price > 1000.0
}

// AFTER
fn is_eligible(order: &Order) -> bool {
    order.base_price > 1000.0
}
```

## Related Smells

(none specific)

## Inverse

Extract Variable (#03)
