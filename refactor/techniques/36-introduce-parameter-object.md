# Introduce Parameter Object

**Category:** Simplifying Method Calls
**Sources:** Fowler Ch.6, Shvets Ch.10

## Problem

Several parameters always travel together across multiple function signatures. This "data clump" bloats parameter lists, makes function calls harder to read, and forces every caller to know the individual components when they should only care about the composite concept.

## Motivation

Grouping related parameters into a single object reduces the parameter count and makes the concept explicit. A `DateRange` is more meaningful than `start_date, end_date`. The parameter object can also attract behavior — range comparison, validation, formatting — that would otherwise be duplicated at each call site.

## When to Apply

- The same group of 2-3+ parameters appears in 3+ function signatures
- Parameters form a logical group (date range, coordinates, address, price range)
- You find yourself passing the same destructured fields repeatedly
- The parameter group would benefit from its own validation or behavior

## Mechanics

1. Create a class/struct for the parameter group
2. Add a constructor and any useful methods (validation, comparison)
3. Replace the parameter group in one function signature at a time
4. Update callers to construct the object
5. Look for behavior that can move into the new object
6. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def readings_outside_range(station: Station, min_temp: float, max_temp: float) -> list[Reading]:
    return [r for r in station.readings if r.temp < min_temp or r.temp > max_temp]

def average_in_range(station: Station, min_temp: float, max_temp: float) -> float:
    in_range = [r for r in station.readings if min_temp <= r.temp <= max_temp]
    return sum(r.temp for r in in_range) / len(in_range)

def alert_if_outside(station: Station, min_temp: float, max_temp: float) -> None:
    for r in readings_outside_range(station, min_temp, max_temp):
        send_alert(r)

# AFTER
from dataclasses import dataclass

@dataclass(frozen=True)
class TemperatureRange:
    min: float
    max: float

    def contains(self, value: float) -> bool:
        return self.min <= value <= self.max

    def __post_init__(self):
        if self.min > self.max:
            raise ValueError(f"min ({self.min}) must be <= max ({self.max})")

def readings_outside_range(station: Station, range: TemperatureRange) -> list[Reading]:
    return [r for r in station.readings if not range.contains(r.temp)]

def average_in_range(station: Station, range: TemperatureRange) -> float:
    in_range = [r for r in station.readings if range.contains(r.temp)]
    return sum(r.temp for r in in_range) / len(in_range)

def alert_if_outside(station: Station, range: TemperatureRange) -> None:
    for r in readings_outside_range(station, range):
        send_alert(r)
```

### TypeScript

```typescript
// BEFORE
function readingsOutsideRange(
  station: Station, minTemp: number, maxTemp: number
): Reading[] {
  return station.readings.filter(r => r.temp < minTemp || r.temp > maxTemp);
}

function averageInRange(
  station: Station, minTemp: number, maxTemp: number
): number {
  const inRange = station.readings.filter(r => r.temp >= minTemp && r.temp <= maxTemp);
  return inRange.reduce((sum, r) => sum + r.temp, 0) / inRange.length;
}

// AFTER
class TemperatureRange {
  constructor(
    public readonly min: number,
    public readonly max: number
  ) {
    if (min > max) throw new Error(`min (${min}) must be <= max (${max})`);
  }

  contains(value: number): boolean {
    return value >= this.min && value <= this.max;
  }
}

function readingsOutsideRange(station: Station, range: TemperatureRange): Reading[] {
  return station.readings.filter(r => !range.contains(r.temp));
}

function averageInRange(station: Station, range: TemperatureRange): number {
  const inRange = station.readings.filter(r => range.contains(r.temp));
  return inRange.reduce((sum, r) => sum + r.temp, 0) / inRange.length;
}
```

### Go

```go
// BEFORE
func ReadingsOutsideRange(station Station, minTemp, maxTemp float64) []Reading {
	var result []Reading
	for _, r := range station.Readings {
		if r.Temp < minTemp || r.Temp > maxTemp {
			result = append(result, r)
		}
	}
	return result
}

// AFTER
type TemperatureRange struct {
	Min float64
	Max float64
}

func NewTemperatureRange(min, max float64) (TemperatureRange, error) {
	if min > max {
		return TemperatureRange{}, fmt.Errorf("min (%f) must be <= max (%f)", min, max)
	}
	return TemperatureRange{Min: min, Max: max}, nil
}

func (tr TemperatureRange) Contains(value float64) bool {
	return value >= tr.Min && value <= tr.Max
}

func ReadingsOutsideRange(station Station, tempRange TemperatureRange) []Reading {
	var result []Reading
	for _, r := range station.Readings {
		if !tempRange.Contains(r.Temp) {
			result = append(result, r)
		}
	}
	return result
}
```

### Rust

```rust
// BEFORE
fn readings_outside_range(station: &Station, min_temp: f64, max_temp: f64) -> Vec<&Reading> {
    station.readings.iter()
        .filter(|r| r.temp < min_temp || r.temp > max_temp)
        .collect()
}

// AFTER
#[derive(Debug, Clone, Copy)]
struct TemperatureRange {
    min: f64,
    max: f64,
}

impl TemperatureRange {
    fn new(min: f64, max: f64) -> Result<Self, String> {
        if min > max {
            return Err(format!("min ({min}) must be <= max ({max})"));
        }
        Ok(Self { min, max })
    }

    fn contains(&self, value: f64) -> bool {
        value >= self.min && value <= self.max
    }
}

fn readings_outside_range<'a>(
    station: &'a Station,
    range: &TemperatureRange,
) -> Vec<&'a Reading> {
    station.readings.iter()
        .filter(|r| !range.contains(r.temp))
        .collect()
}
```

## Related Smells

Long Parameter List, Data Clumps, Primitive Obsession

## Inverse

(none)
