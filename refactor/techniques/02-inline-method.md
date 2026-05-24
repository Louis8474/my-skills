# Inline Method / Inline Function

**Category:** Composing Methods
**Sources:** Fowler Ch.6, Shvets Ch.6
**Also known as:** Inline Function

## Problem

A function body is as clear as the function name itself. The extra indirection adds no value and makes the code harder to follow by forcing the reader to jump to another definition.

## Motivation

Sometimes functions are so short and obvious that they obscure rather than clarify. When a function's body is just as readable as its name, inlining it removes unnecessary indirection. This is also useful when you have a group of badly factored methods and want to inline them all, then re-extract in a better way.

## When to Apply

- The function body is as readable as the function name
- Too many small delegations obscure the overall logic flow
- The function has only one caller and adds no reuse value
- You want to re-extract methods along different boundaries

## Mechanics

1. Check that the function is not polymorphic (not overridden in subclasses/implementations)
2. Find all callers of the function
3. Replace each call site with the function body
4. Remove the function definition
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class DeliveryService:
    def get_rating(self, driver: Driver) -> int:
        return 2 if self._more_than_five_late_deliveries(driver) else 1

    def _more_than_five_late_deliveries(self, driver: Driver) -> bool:
        return driver.late_deliveries > 5

# AFTER
class DeliveryService:
    def get_rating(self, driver: Driver) -> int:
        return 2 if driver.late_deliveries > 5 else 1
```

### TypeScript

```typescript
// BEFORE
class DeliveryService {
  getRating(driver: Driver): number {
    return this.moreThanFiveLateDeliveries(driver) ? 2 : 1;
  }

  private moreThanFiveLateDeliveries(driver: Driver): boolean {
    return driver.lateDeliveries > 5;
  }
}

// AFTER
class DeliveryService {
  getRating(driver: Driver): number {
    return driver.lateDeliveries > 5 ? 2 : 1;
  }
}
```

### Go

```go
// BEFORE
func GetRating(driver Driver) int {
	if moreThanFiveLateDeliveries(driver) {
		return 2
	}
	return 1
}

func moreThanFiveLateDeliveries(driver Driver) bool {
	return driver.LateDeliveries > 5
}

// AFTER
func GetRating(driver Driver) int {
	if driver.LateDeliveries > 5 {
		return 2
	}
	return 1
}
```

### Rust

```rust
// BEFORE
fn get_rating(driver: &Driver) -> u8 {
    if more_than_five_late_deliveries(driver) { 2 } else { 1 }
}

fn more_than_five_late_deliveries(driver: &Driver) -> bool {
    driver.late_deliveries > 5
}

// AFTER
fn get_rating(driver: &Driver) -> u8 {
    if driver.late_deliveries > 5 { 2 } else { 1 }
}
```

## Related Smells

Lazy Element

## Inverse

Extract Method (#01)
