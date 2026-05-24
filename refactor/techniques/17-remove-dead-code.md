# Remove Dead Code

**Category:** Moving Features
**Sources:** Fowler Ch.8, Shvets Ch.8

## Problem

Code that is never executed: unreachable conditions, unused functions, variables assigned but never read, and commented-out code kept "just in case." Dead code adds noise, increases cognitive load, and risks confusing future maintainers who may not realize it is unused.

## Motivation

Dead code is a maintenance burden that provides zero value. Every time someone reads the file, they waste time considering code that does nothing. Commented-out code signals uncertainty and invites more dead code to accumulate. Version control already preserves history — there is no need to keep dead code as a "backup." Delete it.

## When to Apply

- A function or method is never called (search for callers to confirm)
- A condition is never true (e.g., dead branch after a guard clause)
- Variables are assigned but never read
- Code is commented out "just in case"
- A feature flag was removed but the old code path remains

## Mechanics

1. Verify the code is truly unused (search for callers, check for reflection/dynamic dispatch)
2. Delete the dead code
3. Test — if tests pass, the code was indeed dead
4. Version control has the history if it is ever needed again

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def calculate_discount(price: float, customer_type: str) -> float:
    if customer_type == "premium":
        return price * 0.2

    # Old loyalty discount — replaced by premium tier
    # if customer_type == "loyal":
    #     if price > 100:
    #         return price * 0.1
    #     return price * 0.05

    return 0.0

def _old_tax_calculation(price: float) -> float:
    """No longer used since tax reform update."""
    return price * 0.15

# AFTER
def calculate_discount(price: float, customer_type: str) -> float:
    if customer_type == "premium":
        return price * 0.2
    return 0.0
```

### TypeScript

```typescript
// BEFORE
function calculateDiscount(price: number, customerType: string): number {
  if (customerType === "premium") {
    return price * 0.2;
  }

  // Old loyalty discount — replaced by premium tier
  // if (customerType === "loyal") {
  //   if (price > 100) return price * 0.1;
  //   return price * 0.05;
  // }

  return 0;
}

function oldTaxCalculation(price: number): number {
  return price * 0.15; // no longer used since tax reform update
}

// AFTER
function calculateDiscount(price: number, customerType: string): number {
  if (customerType === "premium") {
    return price * 0.2;
  }
  return 0;
}
```

### Go

```go
// BEFORE
func CalculateDiscount(price float64, customerType string) float64 {
	if customerType == "premium" {
		return price * 0.2
	}

	// Old loyalty discount — replaced by premium tier
	// if customerType == "loyal" {
	//     if price > 100 {
	//         return price * 0.1
	//     }
	//     return price * 0.05
	// }

	return 0
}

// oldTaxCalculation is no longer used since tax reform update.
func oldTaxCalculation(price float64) float64 {
	return price * 0.15
}

// AFTER
func CalculateDiscount(price float64, customerType string) float64 {
	if customerType == "premium" {
		return price * 0.2
	}
	return 0
}
```

### Rust

```rust
// BEFORE
fn calculate_discount(price: f64, customer_type: &str) -> f64 {
    if customer_type == "premium" {
        return price * 0.2;
    }

    // Old loyalty discount — replaced by premium tier
    // if customer_type == "loyal" {
    //     if price > 100.0 { return price * 0.1; }
    //     return price * 0.05;
    // }

    0.0
}

#[allow(dead_code)]
fn old_tax_calculation(price: f64) -> f64 {
    price * 0.15
}

// AFTER
fn calculate_discount(price: f64, customer_type: &str) -> f64 {
    if customer_type == "premium" {
        return price * 0.2;
    }
    0.0
}
```

## Related Smells

Dead Code, Speculative Generality

## Inverse

(none)
