# Replace Nested Conditional with Guard Clauses

**Category:** Simplifying Conditionals
**Sources:** Fowler Ch.10, Shvets Ch.9

## Problem

Deeply nested if/else chains make the happy path hard to find. The reader must mentally track multiple levels of indentation to understand which conditions lead to the main logic. Special cases and error handling are buried inside else branches, far from the conditions that trigger them.

## Motivation

Guard clauses handle special cases and errors with early returns at the top of the function, leaving the main logic at the base indentation level. This "fail fast" pattern makes the function's structure immediately clear: deal with exceptions first, then proceed with the normal case.

## When to Apply

- Function has 3+ levels of nesting
- Special cases are handled inside deeply nested else branches
- The "happy path" is indented several levels deep
- You need to scroll or trace carefully to find where the main logic lives

## Mechanics

1. Identify special cases and error conditions
2. Replace each with a guard clause (early return/throw at the top)
3. Remove the now-unnecessary else branches
4. The remaining code is the happy path at the base indentation level
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def calculate_pay(employee: Employee) -> float:
    if employee.is_active:
        if employee.is_retired:
            result = employee.pension_amount()
        else:
            if employee.is_separated:
                result = employee.severance_amount()
            else:
                result = employee.salary() + employee.bonus()
    else:
        result = 0.0
    return result

# AFTER
def calculate_pay(employee: Employee) -> float:
    if not employee.is_active:
        return 0.0
    if employee.is_retired:
        return employee.pension_amount()
    if employee.is_separated:
        return employee.severance_amount()
    return employee.salary() + employee.bonus()
```

### TypeScript

```typescript
// BEFORE
function calculatePay(employee: Employee): number {
  let result: number;
  if (employee.isActive) {
    if (employee.isRetired) {
      result = employee.pensionAmount();
    } else {
      if (employee.isSeparated) {
        result = employee.severanceAmount();
      } else {
        result = employee.salary() + employee.bonus();
      }
    }
  } else {
    result = 0;
  }
  return result;
}

// AFTER
function calculatePay(employee: Employee): number {
  if (!employee.isActive) return 0;
  if (employee.isRetired) return employee.pensionAmount();
  if (employee.isSeparated) return employee.severanceAmount();
  return employee.salary() + employee.bonus();
}
```

### Go

```go
// BEFORE
func calculatePay(e Employee) float64 {
	var result float64
	if e.IsActive {
		if e.IsRetired {
			result = e.PensionAmount()
		} else {
			if e.IsSeparated {
				result = e.SeveranceAmount()
			} else {
				result = e.Salary() + e.Bonus()
			}
		}
	} else {
		result = 0
	}
	return result
}

// AFTER
func calculatePay(e Employee) float64 {
	if !e.IsActive {
		return 0
	}
	if e.IsRetired {
		return e.PensionAmount()
	}
	if e.IsSeparated {
		return e.SeveranceAmount()
	}
	return e.Salary() + e.Bonus()
}
```

### Rust

```rust
// BEFORE
fn calculate_pay(employee: &Employee) -> f64 {
    if employee.is_active {
        if employee.is_retired {
            employee.pension_amount()
        } else {
            if employee.is_separated {
                employee.severance_amount()
            } else {
                employee.salary() + employee.bonus()
            }
        }
    } else {
        0.0
    }
}

// AFTER
fn calculate_pay(employee: &Employee) -> f64 {
    if !employee.is_active {
        return 0.0;
    }
    if employee.is_retired {
        return employee.pension_amount();
    }
    if employee.is_separated {
        return employee.severance_amount();
    }
    employee.salary() + employee.bonus()
}
```

## Related Smells

Long Method, Arrow Code (deep nesting)

## Inverse

(none)
