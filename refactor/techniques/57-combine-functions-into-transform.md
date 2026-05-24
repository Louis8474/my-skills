# Combine Functions into Transform

**Category:** Additional Techniques
**Sources:** Fowler Ch.6

## Problem

Multiple functions derive values from the same source data, and these calculations are scattered throughout the codebase. Each caller must know which derivation functions to call and in what order, and the derived values are recomputed every time.

## Motivation

When multiple pieces of code need enriched versions of the same raw data, a transform function centralizes all the derivations in one place. It takes the raw data, produces an enriched copy with all derived fields attached, and returns it. This is particularly useful for read-only pipelines where you want to enrich data without mutating the original. Unlike "Combine Functions into Class," this approach works well for data flowing through pipelines.

## When to Apply

- Multiple callers derive the same values from the same raw data
- The derivations are read-only (no mutation of the source)
- You want a single point of enrichment in a data pipeline
- Derived values should be computed once and reused, not recalculated

## Mechanics

1. Create a transform function that takes the raw data as input
2. Make a copy (deep clone) of the input to avoid mutation
3. Add all derived values to the copy
4. Return the enriched copy
5. Replace scattered derivation calls with reads from the enriched record
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

# Callers compute derived values independently
raw = {"quantity": 100, "rate": 0.5, "tax_threshold": 20}
print(base_charge(raw))
print(taxable_charge(raw))

# AFTER
from copy import deepcopy

def enrich_reading(raw: dict) -> dict:
    result = deepcopy(raw)
    result["base_charge"] = result["quantity"] * result["rate"]
    result["taxable_charge"] = max(0, result["base_charge"] - result["tax_threshold"])
    result["total_charge"] = result["base_charge"] + result["taxable_charge"] * 0.1
    return result

raw = {"quantity": 100, "rate": 0.5, "tax_threshold": 20}
reading = enrich_reading(raw)
print(reading["base_charge"])
print(reading["taxable_charge"])
print(reading["total_charge"])
```

### TypeScript

```typescript
// BEFORE
interface RawReading {
  quantity: number;
  rate: number;
  taxThreshold: number;
}

function baseCharge(r: RawReading): number { return r.quantity * r.rate; }
function taxableCharge(r: RawReading): number {
  return Math.max(0, baseCharge(r) - r.taxThreshold);
}

// AFTER
interface EnrichedReading extends RawReading {
  baseCharge: number;
  taxableCharge: number;
  totalCharge: number;
}

function enrichReading(raw: RawReading): EnrichedReading {
  const baseCharge = raw.quantity * raw.rate;
  const taxableCharge = Math.max(0, baseCharge - raw.taxThreshold);
  return {
    ...raw,
    baseCharge,
    taxableCharge,
    totalCharge: baseCharge + taxableCharge * 0.1,
  };
}

const reading = enrichReading({ quantity: 100, rate: 0.5, taxThreshold: 20 });
console.log(reading.totalCharge);
```

### Go

```go
// BEFORE
type RawReading struct {
	Quantity     float64
	Rate         float64
	TaxThreshold float64
}

func BaseCharge(r RawReading) float64    { return r.Quantity * r.Rate }
func TaxableCharge(r RawReading) float64 { return math.Max(0, BaseCharge(r)-r.TaxThreshold) }

// AFTER
type EnrichedReading struct {
	Quantity       float64
	Rate           float64
	TaxThreshold   float64
	BaseCharge     float64
	TaxableCharge  float64
	TotalCharge    float64
}

func EnrichReading(raw RawReading) EnrichedReading {
	base := raw.Quantity * raw.Rate
	taxable := math.Max(0, base-raw.TaxThreshold)
	return EnrichedReading{
		Quantity:      raw.Quantity,
		Rate:          raw.Rate,
		TaxThreshold:  raw.TaxThreshold,
		BaseCharge:    base,
		TaxableCharge: taxable,
		TotalCharge:   base + taxable*0.1,
	}
}
```

### Rust

```rust
// BEFORE
struct RawReading {
    quantity: f64,
    rate: f64,
    tax_threshold: f64,
}

fn base_charge(r: &RawReading) -> f64 { r.quantity * r.rate }
fn taxable_charge(r: &RawReading) -> f64 { (base_charge(r) - r.tax_threshold).max(0.0) }

// AFTER
struct EnrichedReading {
    quantity: f64,
    rate: f64,
    tax_threshold: f64,
    base_charge: f64,
    taxable_charge: f64,
    total_charge: f64,
}

fn enrich_reading(raw: &RawReading) -> EnrichedReading {
    let base = raw.quantity * raw.rate;
    let taxable = (base - raw.tax_threshold).max(0.0);
    EnrichedReading {
        quantity: raw.quantity,
        rate: raw.rate,
        tax_threshold: raw.tax_threshold,
        base_charge: base,
        taxable_charge: taxable,
        total_charge: base + taxable * 0.1,
    }
}
```

## Related Smells

Duplicated Code, Feature Envy

## Inverse

(none)
