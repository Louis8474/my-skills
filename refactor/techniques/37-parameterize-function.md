# Parameterize Function

**Category:** Simplifying Method Calls
**Sources:** Fowler Ch.6, Shvets Ch.10

## Problem

Two or more functions do essentially the same thing but with different hardcoded values. The logic is duplicated, and any bug fix or enhancement must be applied to every copy.

## Motivation

Extracting the varying value into a parameter unifies the duplicated functions into one. This eliminates duplication, reduces the API surface, and makes it trivial to support new values without writing new functions.

## When to Apply

- Two functions differ only by a literal value (percentage, threshold, label)
- Copy-paste functions with minor variations
- A new variation requires creating yet another copy of the same function

## Mechanics

1. Identify the literal value(s) that differ between the functions
2. Create a single function that accepts the varying value as a parameter
3. Replace all duplicate functions with calls to the parameterized version
4. Remove the duplicate functions
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def raise_by_five_percent(salary: float) -> float:
    return salary * 1.05

def raise_by_ten_percent(salary: float) -> float:
    return salary * 1.10

def raise_by_twenty_percent(salary: float) -> float:
    return salary * 1.20

# Usage
new_salary = raise_by_ten_percent(50000)

# AFTER
def raise_salary(salary: float, percentage: float) -> float:
    if not 0 <= percentage <= 100:
        raise ValueError(f"Percentage must be 0..100, got {percentage}")
    return salary * (1 + percentage / 100)

# Usage
new_salary = raise_salary(50000, 10)
```

### TypeScript

```typescript
// BEFORE
function chargeForBottomBand(usage: number): number {
  if (usage <= 0) return 0;
  return Math.min(usage, 100) * 0.03;
}

function chargeForMiddleBand(usage: number): number {
  if (usage <= 100) return 0;
  return Math.min(usage - 100, 200) * 0.05;
}

function chargeForTopBand(usage: number): number {
  if (usage <= 300) return 0;
  return (usage - 300) * 0.07;
}

// AFTER
function chargeForBand(
  usage: number,
  bottom: number,
  top: number,
  rate: number
): number {
  if (usage <= bottom) return 0;
  const billableUsage = top === Infinity
    ? usage - bottom
    : Math.min(usage, top) - bottom;
  return billableUsage * rate;
}

function totalCharge(usage: number): number {
  return (
    chargeForBand(usage, 0, 100, 0.03) +
    chargeForBand(usage, 100, 300, 0.05) +
    chargeForBand(usage, 300, Infinity, 0.07)
  );
}
```

### Go

```go
// BEFORE
func RaiseByFivePercent(salary float64) float64 {
	return salary * 1.05
}

func RaiseByTenPercent(salary float64) float64 {
	return salary * 1.10
}

func RaiseByTwentyPercent(salary float64) float64 {
	return salary * 1.20
}

// AFTER
func RaiseSalary(salary, percentage float64) float64 {
	return salary * (1 + percentage/100)
}

// Usage
newSalary := RaiseSalary(50000, 10)
```

### Rust

```rust
// BEFORE
fn raise_by_five_percent(salary: f64) -> f64 {
    salary * 1.05
}

fn raise_by_ten_percent(salary: f64) -> f64 {
    salary * 1.10
}

fn raise_by_twenty_percent(salary: f64) -> f64 {
    salary * 1.20
}

// AFTER
fn raise_salary(salary: f64, percentage: f64) -> f64 {
    assert!(
        (0.0..=100.0).contains(&percentage),
        "Percentage must be 0..100, got {percentage}"
    );
    salary * (1.0 + percentage / 100.0)
}

// Usage
let new_salary = raise_salary(50_000.0, 10.0);
```

## Related Smells

Duplicated Code, Long Method

## Inverse

(none)
