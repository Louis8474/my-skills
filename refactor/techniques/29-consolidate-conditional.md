# Consolidate Conditional Expression

**Category:** Simplifying Conditionals
**Sources:** Fowler Ch.10, Shvets Ch.9

## Problem

Multiple conditional checks lead to the same result. The separate checks obscure the fact that they represent a single logical condition. Readers must examine each branch to realize they all do the same thing.

## Motivation

Combining guards that produce the same outcome into a single conditional makes the logic explicit. Once consolidated, the combined condition often reveals a meaningful concept that deserves its own named function (e.g., "is not eligible"). This also reduces duplication and makes it easier to modify the shared result.

## When to Apply

- Sequential `if` statements all return the same value or perform the same action
- Guards at the top of a function that all lead to the same early return
- Conditions are logically related but written as separate checks

## Mechanics

1. Verify that all conditionals have the same result (same return value, same side effect)
2. Combine the conditions using logical operators (`or`/`||`/`&&`)
3. Extract the combined condition into a well-named predicate function
4. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def disability_amount(employee: Employee) -> float:
    if employee.seniority < 2:
        return 0
    if employee.months_disabled > 12:
        return 0
    if employee.is_part_time:
        return 0
    return employee.base_disability_amount()

# AFTER
def disability_amount(employee: Employee) -> float:
    if is_not_eligible_for_disability(employee):
        return 0
    return employee.base_disability_amount()

def is_not_eligible_for_disability(employee: Employee) -> bool:
    return (
        employee.seniority < 2
        or employee.months_disabled > 12
        or employee.is_part_time
    )
```

### TypeScript

```typescript
// BEFORE
function disabilityAmount(employee: Employee): number {
  if (employee.seniority < 2) return 0;
  if (employee.monthsDisabled > 12) return 0;
  if (employee.isPartTime) return 0;
  return employee.baseDisabilityAmount();
}

// AFTER
function disabilityAmount(employee: Employee): number {
  if (isNotEligibleForDisability(employee)) return 0;
  return employee.baseDisabilityAmount();
}

function isNotEligibleForDisability(employee: Employee): boolean {
  return (
    employee.seniority < 2 ||
    employee.monthsDisabled > 12 ||
    employee.isPartTime
  );
}
```

### Go

```go
// BEFORE
func disabilityAmount(e Employee) float64 {
	if e.Seniority < 2 {
		return 0
	}
	if e.MonthsDisabled > 12 {
		return 0
	}
	if e.IsPartTime {
		return 0
	}
	return e.BaseDisabilityAmount()
}

// AFTER
func disabilityAmount(e Employee) float64 {
	if isNotEligibleForDisability(e) {
		return 0
	}
	return e.BaseDisabilityAmount()
}

func isNotEligibleForDisability(e Employee) bool {
	return e.Seniority < 2 || e.MonthsDisabled > 12 || e.IsPartTime
}
```

### Rust

```rust
// BEFORE
fn disability_amount(employee: &Employee) -> f64 {
    if employee.seniority < 2 {
        return 0.0;
    }
    if employee.months_disabled > 12 {
        return 0.0;
    }
    if employee.is_part_time {
        return 0.0;
    }
    employee.base_disability_amount()
}

// AFTER
fn disability_amount(employee: &Employee) -> f64 {
    if !is_eligible_for_disability(employee) {
        return 0.0;
    }
    employee.base_disability_amount()
}

fn is_eligible_for_disability(employee: &Employee) -> bool {
    employee.seniority >= 2
        && employee.months_disabled <= 12
        && !employee.is_part_time
}
```

## Related Smells

Duplicated Code, Long Method

## Inverse

(none)
