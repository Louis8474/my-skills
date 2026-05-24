# Change Function Declaration / Rename Method

**Category:** Simplifying Method Calls
**Sources:** Fowler Ch.6, Shvets Ch.10
**Also known as:** Rename Method, Change Signature

## Problem

A function's name doesn't describe what it does, or its parameter list doesn't match current needs. A misleading name forces readers to look at the implementation to understand the function's purpose. A parameter list that has grown organically may include unused params or be missing needed ones.

## Motivation

A function's declaration — its name and parameters — is the first thing a reader sees. If the name is wrong, every call site is a source of confusion. If the parameters are wrong, callers do unnecessary work or the function reaches into global state. Fixing the declaration is one of the highest-leverage refactorings: it improves every call site at once.

## When to Apply

- Function name is abbreviated, misleading, or describes the "how" instead of the "what"
- A parameter is unused and should be removed
- A new parameter is needed to avoid reaching into global state
- Parameter order is confusing or inconsistent with related functions

## Mechanics

### Simple (rename only)
1. Rename the function at its declaration
2. Update all call sites
3. Test

### Migration (when callers can't all be updated at once)
1. Create a new function with the desired signature
2. Have the old function delegate to the new one
3. Deprecate the old function
4. Migrate callers incrementally
5. Remove the old function
6. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def circum(r: float) -> float:
    """Calculate circumference."""
    return 2 * 3.14159 * r

def dist(x1: float, y1: float, x2: float, y2: float) -> float:
    return ((x2 - x1) ** 2 + (y2 - y1) ** 2) ** 0.5

# Callers must guess what 'circum' and 'dist' do
area = circum(5)  # confusing — this is circumference, not area

# AFTER
import math
from dataclasses import dataclass

def circumference(radius: float) -> float:
    return 2 * math.pi * radius

@dataclass(frozen=True)
class Point:
    x: float
    y: float

def distance(start: Point, end: Point) -> float:
    return math.hypot(end.x - start.x, end.y - start.y)

# Call sites are now self-documenting
perimeter = circumference(5)
d = distance(Point(0, 0), Point(3, 4))
```

### TypeScript

```typescript
// BEFORE
function circum(r: number): number {
  return 2 * Math.PI * r;
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

// AFTER
function circumference(radius: number): number {
  return 2 * Math.PI * radius;
}

interface Point {
  x: number;
  y: number;
}

function distance(start: Point, end: Point): number {
  return Math.hypot(end.x - start.x, end.y - start.y);
}
```

### Go

```go
// BEFORE
func Circum(r float64) float64 {
	return 2 * math.Pi * r
}

func Dist(x1, y1, x2, y2 float64) float64 {
	return math.Hypot(x2-x1, y2-y1)
}

// AFTER
func Circumference(radius float64) float64 {
	return 2 * math.Pi * radius
}

type Point struct {
	X, Y float64
}

func Distance(start, end Point) float64 {
	return math.Hypot(end.X-start.X, end.Y-start.Y)
}
```

### Rust

```rust
// BEFORE
fn circum(r: f64) -> f64 {
    2.0 * std::f64::consts::PI * r
}

fn dist(x1: f64, y1: f64, x2: f64, y2: f64) -> f64 {
    ((x2 - x1).powi(2) + (y2 - y1).powi(2)).sqrt()
}

// AFTER
fn circumference(radius: f64) -> f64 {
    2.0 * std::f64::consts::PI * radius
}

struct Point {
    x: f64,
    y: f64,
}

fn distance(start: &Point, end: &Point) -> f64 {
    ((end.x - start.x).powi(2) + (end.y - start.y).powi(2)).sqrt()
}
```

## Related Smells

Mysterious Name, Long Parameter List

## Inverse

(none)
