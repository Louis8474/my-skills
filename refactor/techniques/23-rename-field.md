# Rename Field / Rename Variable

**Category:** Organizing Data
**Sources:** Fowler Ch.7

## Problem

A field or variable name does not communicate its purpose. Abbreviated, ambiguous, or misleading names force readers to deduce meaning from context, slowing comprehension and inviting bugs.

## Motivation

Names are the primary tool for communicating intent. A well-chosen name eliminates the need for comments and makes code self-documenting. Renaming is cheap but has a compounding return: every future reader benefits. The best time to rename is when you first notice the confusion.

## When to Apply

- Name is a single letter or cryptic abbreviation (`d`, `hp`, `qty`, `tmp`)
- Name is misleading (e.g., `start` that actually holds an end time)
- Name doesn't distinguish from similar fields (`value1`, `value2`)
- Domain terminology has evolved and the old name is outdated
- You need a comment to explain what a variable holds

## Mechanics

1. Choose a name that describes the field's purpose, not its type
2. Rename the field declaration
3. Update all references (constructors, getters, serialization, tests, API contracts)
4. If the field is part of a public API, consider a deprecation period
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Flight:
    def __init__(self, d: int, hp: float, dst: str):
        self.d = d       # elapsed days
        self.hp = hp     # half price
        self.dst = dst   # destination

    def summary(self) -> str:
        return f"{self.dst} in {self.d}d at ${self.hp * 2:.2f}"

# AFTER
class Flight:
    def __init__(self, elapsed_days: int, half_price: float, destination: str):
        self.elapsed_days = elapsed_days
        self.half_price = half_price
        self.destination = destination

    def summary(self) -> str:
        return f"{self.destination} in {self.elapsed_days}d at ${self.half_price * 2:.2f}"
```

### TypeScript

```typescript
// BEFORE
interface Flight {
  d: number;     // elapsed days
  hp: number;    // half price
  dst: string;   // destination
}

function summary(f: Flight): string {
  return `${f.dst} in ${f.d}d at $${(f.hp * 2).toFixed(2)}`;
}

// AFTER
interface Flight {
  elapsedDays: number;
  halfPrice: number;
  destination: string;
}

function summary(flight: Flight): string {
  return `${flight.destination} in ${flight.elapsedDays}d at $${(flight.halfPrice * 2).toFixed(2)}`;
}
```

### Go

```go
// BEFORE
type Flight struct {
	D   int     // elapsed days
	Hp  float64 // half price
	Dst string  // destination
}

func (f Flight) Summary() string {
	return fmt.Sprintf("%s in %dd at $%.2f", f.Dst, f.D, f.Hp*2)
}

// AFTER
type Flight struct {
	ElapsedDays int
	HalfPrice   float64
	Destination string
}

func (f Flight) Summary() string {
	return fmt.Sprintf("%s in %dd at $%.2f", f.Destination, f.ElapsedDays, f.HalfPrice*2)
}
```

### Rust

```rust
// BEFORE
struct Flight {
    d: u32,       // elapsed days
    hp: f64,      // half price
    dst: String,  // destination
}

impl Flight {
    fn summary(&self) -> String {
        format!("{} in {}d at ${:.2}", self.dst, self.d, self.hp * 2.0)
    }
}

// AFTER
struct Flight {
    elapsed_days: u32,
    half_price: f64,
    destination: String,
}

impl Flight {
    fn summary(&self) -> String {
        format!("{} in {}d at ${:.2}", self.destination, self.elapsed_days, self.half_price * 2.0)
    }
}
```

## Related Smells

Mysterious Name, Comments (as deodorant)

## Inverse

(none)
