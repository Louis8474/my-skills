# Preserve Whole Object

**Category:** Simplifying Method Calls
**Sources:** Fowler Ch.6, Shvets Ch.10

## Problem

Code extracts several values from an object and passes them as separate parameters to a function. This inflates the parameter list, creates coupling to the object's internal structure, and forces every caller to repeat the extraction. When the object gains a new relevant field, every call site must be updated.

## Motivation

Passing the whole object instead of its parts reduces the parameter count and decouples callers from the object's structure. The receiving function can extract what it needs, and if requirements change (e.g., the function needs an additional field), only the function body changes — not every caller.

## When to Apply

- Multiple values are extracted from the same object just to pass as params
- The same extraction pattern is repeated at multiple call sites
- The function might need more fields from the object in the future
- The parameter list is growing because of fields from a single source object

## Mechanics

1. Add a parameter for the whole object
2. Move the field extraction into the receiving function
3. Remove the individual parameters one at a time
4. Update all callers to pass the whole object
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class HeatingPlan:
    def within_range(self, low: float, high: float) -> bool:
        return low >= self.temperature_floor and high <= self.temperature_ceiling

# Caller extracts values from room — repeated everywhere
if plan.within_range(room.low_temp, room.high_temp):
    send_alert("Temperature in range")

# AFTER
class TemperatureRange:
    def __init__(self, low: float, high: float):
        self.low = low
        self.high = high

class HeatingPlan:
    def within_range(self, room_range: TemperatureRange) -> bool:
        return (room_range.low >= self.temperature_floor
                and room_range.high <= self.temperature_ceiling)

# Caller passes the object — no extraction needed
if plan.within_range(room.temperature_range):
    send_alert("Temperature in range")
```

### TypeScript

```typescript
// BEFORE
class HeatingPlan {
  withinRange(low: number, high: number): boolean {
    return low >= this.temperatureFloor && high <= this.temperatureCeiling;
  }
}

// Caller extracts values
if (plan.withinRange(room.lowTemp, room.highTemp)) {
  sendAlert("Temperature in range");
}

// AFTER
interface TemperatureRange {
  low: number;
  high: number;
}

class HeatingPlan {
  withinRange(range: TemperatureRange): boolean {
    return range.low >= this.temperatureFloor && range.high <= this.temperatureCeiling;
  }
}

// Caller passes the whole range
if (plan.withinRange(room.temperatureRange)) {
  sendAlert("Temperature in range");
}
```

### Go

```go
// BEFORE
func (p HeatingPlan) WithinRange(low, high float64) bool {
	return low >= p.TemperatureFloor && high <= p.TemperatureCeiling
}

// Caller extracts values
if plan.WithinRange(room.LowTemp, room.HighTemp) {
	sendAlert("Temperature in range")
}

// AFTER
type TemperatureRange struct {
	Low  float64
	High float64
}

func (p HeatingPlan) WithinRange(r TemperatureRange) bool {
	return r.Low >= p.TemperatureFloor && r.High <= p.TemperatureCeiling
}

// Caller passes the whole range
if plan.WithinRange(room.TempRange) {
	sendAlert("Temperature in range")
}
```

### Rust

```rust
// BEFORE
impl HeatingPlan {
    fn within_range(&self, low: f64, high: f64) -> bool {
        low >= self.temperature_floor && high <= self.temperature_ceiling
    }
}

// Caller extracts values
if plan.within_range(room.low_temp, room.high_temp) {
    send_alert("Temperature in range");
}

// AFTER
struct TemperatureRange {
    low: f64,
    high: f64,
}

impl HeatingPlan {
    fn within_range(&self, range: &TemperatureRange) -> bool {
        range.low >= self.temperature_floor && range.high <= self.temperature_ceiling
    }
}

// Caller passes the whole range
if plan.within_range(&room.temp_range) {
    send_alert("Temperature in range");
}
```

## Related Smells

Long Parameter List, Feature Envy, Data Clumps

## Inverse

(none)
