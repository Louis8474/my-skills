# Introduce Assertion

**Category:** Simplifying Conditionals
**Sources:** Fowler Ch.10, Shvets Ch.9

## Problem

Code assumes certain conditions are true but doesn't document or enforce them. When assumptions break, the code fails silently or produces wrong results far from the actual bug, making debugging difficult.

## Motivation

Assertions make assumptions explicit and fail loudly when violated. They serve as executable documentation: a reader sees `assert value > 0` and immediately knows the function's precondition. Assertions catch bugs at the point of violation rather than letting corrupt state propagate through the system.

## When to Apply

- A function assumes its input meets certain criteria (positive, non-null, within range)
- An invariant should always hold at a certain point in the code
- A comment says "this should never be negative" or similar
- Defensive `if` checks exist but silently return or do nothing on failure

## Mechanics

1. Identify assumptions in the code (often hidden in comments or implicit in logic)
2. Add assertions that enforce each assumption
3. Use language-appropriate assertion mechanisms
4. Ensure assertions don't have side effects (they may be disabled in production)
5. Test — verify assertions fire on invalid input

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def apply_discount(price: float, discount_rate: float) -> float:
    # discount_rate should be between 0 and 1
    # price should be positive
    return price * (1 - discount_rate)

# Caller passes bad data — silent wrong result
result = apply_discount(-50, 1.5)  # returns 25.0 (nonsense)

# AFTER
def apply_discount(price: float, discount_rate: float) -> float:
    assert price >= 0, f"Price must be non-negative, got {price}"
    assert 0 <= discount_rate <= 1, f"Discount rate must be 0..1, got {discount_rate}"
    return price * (1 - discount_rate)

# Caller passes bad data — immediate, clear failure
result = apply_discount(-50, 1.5)  # AssertionError: Price must be non-negative, got -50
```

### TypeScript

```typescript
// BEFORE
function applyDiscount(price: number, discountRate: number): number {
  // assumes price >= 0 and discountRate in [0, 1]
  return price * (1 - discountRate);
}

// AFTER
function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function applyDiscount(price: number, discountRate: number): number {
  assert(price >= 0, `Price must be non-negative, got ${price}`);
  assert(discountRate >= 0 && discountRate <= 1, `Discount rate must be 0..1, got ${discountRate}`);
  return price * (1 - discountRate);
}
```

### Go

```go
// BEFORE
func applyDiscount(price, discountRate float64) float64 {
	// price should be positive, discountRate in [0, 1]
	return price * (1 - discountRate)
}

// AFTER — Go has no built-in assert; use if + panic or a helper
func applyDiscount(price, discountRate float64) float64 {
	if price < 0 {
		panic(fmt.Sprintf("price must be non-negative, got %f", price))
	}
	if discountRate < 0 || discountRate > 1 {
		panic(fmt.Sprintf("discount rate must be 0..1, got %f", discountRate))
	}
	return price * (1 - discountRate)
}

// Alternative: return error instead of panic for library code
func applyDiscountSafe(price, discountRate float64) (float64, error) {
	if price < 0 {
		return 0, fmt.Errorf("price must be non-negative, got %f", price)
	}
	if discountRate < 0 || discountRate > 1 {
		return 0, fmt.Errorf("discount rate must be 0..1, got %f", discountRate)
	}
	return price * (1 - discountRate), nil
}
```

### Rust

```rust
// BEFORE
fn apply_discount(price: f64, discount_rate: f64) -> f64 {
    // assumes price >= 0 and discount_rate in [0, 1]
    price * (1.0 - discount_rate)
}

// AFTER — debug_assert! for dev, assert! for always-on checks
fn apply_discount(price: f64, discount_rate: f64) -> f64 {
    assert!(price >= 0.0, "Price must be non-negative, got {price}");
    assert!(
        (0.0..=1.0).contains(&discount_rate),
        "Discount rate must be 0..1, got {discount_rate}"
    );
    price * (1.0 - discount_rate)
}

// For expensive checks that should only run in debug builds:
fn complex_calculation(data: &[f64]) -> f64 {
    debug_assert!(data.iter().all(|x| x.is_finite()), "All values must be finite");
    data.iter().sum()
}
```

## Related Smells

Comments (as deodorant), Mysterious Name

## Inverse

(none)
