# Combine Functions into Class / Combine Functions into Module

**Category:** Additional Techniques
**Sources:** Fowler Ch.6

## Problem

A group of functions all operate on the same data, which is passed around as parameters between them. The functions are logically related but scattered, and the shared data has no home — it is threaded through call after call.

## Motivation

When several functions share the same data, grouping them into a class (or module) gives the data a home and the functions a shared context. Derived values can be computed once and cached. The class name communicates the concept, and the methods express the operations on that concept. This eliminates long parameter lists and makes the relationships between functions explicit.

## When to Apply

- Multiple functions take the same data as their first argument
- You find yourself passing the same struct/record to many related functions
- Derived values are computed repeatedly from the same data
- The functions would benefit from shared state or caching

## Mechanics

1. Identify the group of functions and the data they share
2. Create a class/struct with the shared data as fields
3. Move the functions into the class as methods
4. Remove the data parameter from each method (it is now `self`/`this`)
5. Add derived values as computed properties or lazy fields
6. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def base_charge(reading: dict) -> float:
    return reading["quantity"] * reading["rate"]

def taxable_charge(reading: dict) -> float:
    return max(0, base_charge(reading) - reading["tax_threshold"])

def total_charge(reading: dict) -> float:
    return base_charge(reading) + taxable_charge(reading) * 0.1

# Caller passes `reading` dict everywhere
r = {"quantity": 100, "rate": 0.5, "tax_threshold": 20}
print(total_charge(r))

# AFTER
class Reading:
    def __init__(self, quantity: float, rate: float, tax_threshold: float):
        self.quantity = quantity
        self.rate = rate
        self.tax_threshold = tax_threshold

    @property
    def base_charge(self) -> float:
        return self.quantity * self.rate

    @property
    def taxable_charge(self) -> float:
        return max(0, self.base_charge - self.tax_threshold)

    @property
    def total_charge(self) -> float:
        return self.base_charge + self.taxable_charge * 0.1

r = Reading(quantity=100, rate=0.5, tax_threshold=20)
print(r.total_charge)
```

### TypeScript

```typescript
// BEFORE
function baseCharge(reading: { quantity: number; rate: number }): number {
  return reading.quantity * reading.rate;
}

function taxableCharge(reading: { quantity: number; rate: number; taxThreshold: number }): number {
  return Math.max(0, baseCharge(reading) - reading.taxThreshold);
}

function totalCharge(reading: { quantity: number; rate: number; taxThreshold: number }): number {
  return baseCharge(reading) + taxableCharge(reading) * 0.1;
}

// AFTER
class Reading {
  constructor(
    private quantity: number,
    private rate: number,
    private taxThreshold: number
  ) {}

  get baseCharge(): number {
    return this.quantity * this.rate;
  }

  get taxableCharge(): number {
    return Math.max(0, this.baseCharge - this.taxThreshold);
  }

  get totalCharge(): number {
    return this.baseCharge + this.taxableCharge * 0.1;
  }
}

const r = new Reading(100, 0.5, 20);
console.log(r.totalCharge);
```

### Go

```go
// BEFORE
type ReadingData struct {
	Quantity     float64
	Rate         float64
	TaxThreshold float64
}

func BaseCharge(r ReadingData) float64 {
	return r.Quantity * r.Rate
}

func TaxableCharge(r ReadingData) float64 {
	return math.Max(0, BaseCharge(r)-r.TaxThreshold)
}

func TotalCharge(r ReadingData) float64 {
	return BaseCharge(r) + TaxableCharge(r)*0.1
}

// AFTER
type Reading struct {
	Quantity     float64
	Rate         float64
	TaxThreshold float64
}

func (r *Reading) BaseCharge() float64 {
	return r.Quantity * r.Rate
}

func (r *Reading) TaxableCharge() float64 {
	return math.Max(0, r.BaseCharge()-r.TaxThreshold)
}

func (r *Reading) TotalCharge() float64 {
	return r.BaseCharge() + r.TaxableCharge()*0.1
}
```

### Rust

```rust
// BEFORE
struct ReadingData {
    quantity: f64,
    rate: f64,
    tax_threshold: f64,
}

fn base_charge(r: &ReadingData) -> f64 {
    r.quantity * r.rate
}

fn taxable_charge(r: &ReadingData) -> f64 {
    (base_charge(r) - r.tax_threshold).max(0.0)
}

fn total_charge(r: &ReadingData) -> f64 {
    base_charge(r) + taxable_charge(r) * 0.1
}

// AFTER
struct Reading {
    quantity: f64,
    rate: f64,
    tax_threshold: f64,
}

impl Reading {
    fn base_charge(&self) -> f64 {
        self.quantity * self.rate
    }

    fn taxable_charge(&self) -> f64 {
        (self.base_charge() - self.tax_threshold).max(0.0)
    }

    fn total_charge(&self) -> f64 {
        self.base_charge() + self.taxable_charge() * 0.1
    }
}
```

## Related Smells

Long Parameter List, Data Clumps, Feature Envy

## Inverse

(none)
