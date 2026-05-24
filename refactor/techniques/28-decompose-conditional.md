# Decompose Conditional

**Category:** Simplifying Conditionals
**Sources:** Fowler Ch.10, Shvets Ch.9

## Problem

A complex conditional has a long condition expression and substantial work in each branch. The reader must parse the boolean logic to understand when each branch runs, and then parse the branch bodies to understand what happens. The intent is buried in mechanics.

## Motivation

Extracting the condition into a well-named predicate function and each branch into its own function turns the conditional into a readable narrative: "if it's summer, charge the summer rate; otherwise, charge the winter rate." The code reads like prose instead of algebra.

## When to Apply

- Condition expression involves multiple comparisons or boolean operators
- Branch bodies are more than a few lines
- A comment explains what the condition checks
- The same condition pattern appears in multiple places

## Mechanics

1. Extract the condition expression into a predicate function with a descriptive name
2. Extract each branch body into its own function
3. Replace the original code with calls to the new functions
4. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def calculate_charge(date: date, quantity: int) -> float:
    if date < SUMMER_START or date > SUMMER_END:
        charge = quantity * WINTER_RATE + WINTER_SERVICE_CHARGE
    else:
        charge = quantity * SUMMER_RATE
    return charge

# AFTER
def calculate_charge(date: date, quantity: int) -> float:
    if is_summer(date):
        return summer_charge(quantity)
    return winter_charge(quantity)

def is_summer(d: date) -> bool:
    return SUMMER_START <= d <= SUMMER_END

def summer_charge(quantity: int) -> float:
    return quantity * SUMMER_RATE

def winter_charge(quantity: int) -> float:
    return quantity * WINTER_RATE + WINTER_SERVICE_CHARGE
```

### TypeScript

```typescript
// BEFORE
function calculateCharge(date: Date, quantity: number): number {
  if (date < SUMMER_START || date > SUMMER_END) {
    return quantity * WINTER_RATE + WINTER_SERVICE_CHARGE;
  } else {
    return quantity * SUMMER_RATE;
  }
}

// AFTER
function calculateCharge(date: Date, quantity: number): number {
  if (isSummer(date)) {
    return summerCharge(quantity);
  }
  return winterCharge(quantity);
}

function isSummer(date: Date): boolean {
  return date >= SUMMER_START && date <= SUMMER_END;
}

function summerCharge(quantity: number): number {
  return quantity * SUMMER_RATE;
}

function winterCharge(quantity: number): number {
  return quantity * WINTER_RATE + WINTER_SERVICE_CHARGE;
}
```

### Go

```go
// BEFORE
func calculateCharge(date time.Time, quantity int) float64 {
	if date.Before(summerStart) || date.After(summerEnd) {
		return float64(quantity)*winterRate + winterServiceCharge
	}
	return float64(quantity) * summerRate
}

// AFTER
func calculateCharge(date time.Time, quantity int) float64 {
	if isSummer(date) {
		return summerCharge(quantity)
	}
	return winterCharge(quantity)
}

func isSummer(date time.Time) bool {
	return !date.Before(summerStart) && !date.After(summerEnd)
}

func summerCharge(quantity int) float64 {
	return float64(quantity) * summerRate
}

func winterCharge(quantity int) float64 {
	return float64(quantity)*winterRate + winterServiceCharge
}
```

### Rust

```rust
// BEFORE
fn calculate_charge(date: NaiveDate, quantity: u32) -> f64 {
    if date < SUMMER_START || date > SUMMER_END {
        quantity as f64 * WINTER_RATE + WINTER_SERVICE_CHARGE
    } else {
        quantity as f64 * SUMMER_RATE
    }
}

// AFTER
fn calculate_charge(date: NaiveDate, quantity: u32) -> f64 {
    if is_summer(date) {
        summer_charge(quantity)
    } else {
        winter_charge(quantity)
    }
}

fn is_summer(date: NaiveDate) -> bool {
    date >= SUMMER_START && date <= SUMMER_END
}

fn summer_charge(quantity: u32) -> f64 {
    quantity as f64 * SUMMER_RATE
}

fn winter_charge(quantity: u32) -> f64 {
    quantity as f64 * WINTER_RATE + WINTER_SERVICE_CHARGE
}
```

## Related Smells

Long Method, Comments (as deodorant)

## Inverse

(none)
