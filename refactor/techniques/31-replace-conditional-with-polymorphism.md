# Replace Conditional with Polymorphism

**Category:** Simplifying Conditionals
**Sources:** Fowler Ch.10, Shvets Ch.9

## Problem

A switch or if-else chain selects behavior based on a type, and the same switch appears in multiple places. Every time a new type is added, every switch must be found and updated. This is fragile, violates the Open/Closed Principle, and scatters type-specific logic across the codebase.

## Motivation

Polymorphism lets each type own its behavior. Adding a new type means adding a new class, struct, or enum variant — not hunting through switches. The conditional disappears entirely, replaced by a method call that dispatches to the right implementation automatically.

## When to Apply

- The same switch/if-else on a type field appears in 2+ functions
- Adding a new type requires modifying multiple functions
- Each branch contains type-specific logic that could live in its own class
- You've already applied Replace Type Code with Subclasses (#27) and still have conditionals

## Mechanics

1. Create a type hierarchy (interface/abstract class, or enum with variants)
2. Move each branch body into the corresponding type's method override
3. Replace the conditional with a polymorphic method call
4. Repeat for every function that has the same switch
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Bird:
    def __init__(self, bird_type: str, number_of_coconuts: int = 0, voltage: float = 0):
        self.bird_type = bird_type
        self.number_of_coconuts = number_of_coconuts
        self.voltage = voltage

    def speed(self) -> float:
        if self.bird_type == "european":
            return 35.0
        elif self.bird_type == "african":
            return 40.0 - 3.0 * self.number_of_coconuts
        elif self.bird_type == "norwegian_blue":
            return 0.0 if self.voltage < 10 else 24.0
        raise ValueError(f"Unknown bird: {self.bird_type}")

    def plumage(self) -> str:
        if self.bird_type == "european":
            return "average"
        elif self.bird_type == "african":
            return "tired" if self.number_of_coconuts > 2 else "average"
        elif self.bird_type == "norwegian_blue":
            return "beautiful" if self.voltage > 50 else "scorched"
        raise ValueError(f"Unknown bird: {self.bird_type}")

# AFTER
from abc import ABC, abstractmethod

class Bird(ABC):
    @abstractmethod
    def speed(self) -> float: ...

    @abstractmethod
    def plumage(self) -> str: ...

class EuropeanSwallow(Bird):
    def speed(self) -> float:
        return 35.0

    def plumage(self) -> str:
        return "average"

class AfricanSwallow(Bird):
    def __init__(self, number_of_coconuts: int):
        self.number_of_coconuts = number_of_coconuts

    def speed(self) -> float:
        return 40.0 - 3.0 * self.number_of_coconuts

    def plumage(self) -> str:
        return "tired" if self.number_of_coconuts > 2 else "average"

class NorwegianBlueParrot(Bird):
    def __init__(self, voltage: float):
        self.voltage = voltage

    def speed(self) -> float:
        return 0.0 if self.voltage < 10 else 24.0

    def plumage(self) -> str:
        return "beautiful" if self.voltage > 50 else "scorched"
```

### TypeScript

```typescript
// BEFORE
function speed(bird: Bird): number {
  switch (bird.type) {
    case "european": return 35;
    case "african":  return 40 - 3 * bird.numberOfCoconuts;
    case "norwegian_blue": return bird.voltage < 10 ? 0 : 24;
    default: throw new Error(`Unknown bird: ${bird.type}`);
  }
}

// AFTER
interface Bird {
  speed(): number;
  plumage(): string;
}

class EuropeanSwallow implements Bird {
  speed(): number { return 35; }
  plumage(): string { return "average"; }
}

class AfricanSwallow implements Bird {
  constructor(private numberOfCoconuts: number) {}
  speed(): number { return 40 - 3 * this.numberOfCoconuts; }
  plumage(): string { return this.numberOfCoconuts > 2 ? "tired" : "average"; }
}

class NorwegianBlueParrot implements Bird {
  constructor(private voltage: number) {}
  speed(): number { return this.voltage < 10 ? 0 : 24; }
  plumage(): string { return this.voltage > 50 ? "beautiful" : "scorched"; }
}
```

### Go

```go
// BEFORE
func speed(b Bird) float64 {
	switch b.Type {
	case "european":
		return 35
	case "african":
		return 40 - 3*float64(b.NumberOfCoconuts)
	case "norwegian_blue":
		if b.Voltage < 10 {
			return 0
		}
		return 24
	default:
		panic("unknown bird: " + b.Type)
	}
}

// AFTER — interface + implementations
type Bird interface {
	Speed() float64
	Plumage() string
}

type EuropeanSwallow struct{}

func (e EuropeanSwallow) Speed() float64  { return 35 }
func (e EuropeanSwallow) Plumage() string { return "average" }

type AfricanSwallow struct {
	NumberOfCoconuts int
}

func (a AfricanSwallow) Speed() float64 {
	return 40 - 3*float64(a.NumberOfCoconuts)
}

func (a AfricanSwallow) Plumage() string {
	if a.NumberOfCoconuts > 2 {
		return "tired"
	}
	return "average"
}

type NorwegianBlueParrot struct {
	Voltage float64
}

func (n NorwegianBlueParrot) Speed() float64 {
	if n.Voltage < 10 {
		return 0
	}
	return 24
}

func (n NorwegianBlueParrot) Plumage() string {
	if n.Voltage > 50 {
		return "beautiful"
	}
	return "scorched"
}
```

### Rust

```rust
// BEFORE
fn speed(bird: &Bird) -> f64 {
    match bird.bird_type.as_str() {
        "european" => 35.0,
        "african" => 40.0 - 3.0 * bird.number_of_coconuts as f64,
        "norwegian_blue" => if bird.voltage < 10.0 { 0.0 } else { 24.0 },
        other => panic!("Unknown bird: {other}"),
    }
}

// AFTER — enum with variants (idiomatic Rust) or trait
enum Bird {
    European,
    African { number_of_coconuts: u32 },
    NorwegianBlue { voltage: f64 },
}

impl Bird {
    fn speed(&self) -> f64 {
        match self {
            Bird::European => 35.0,
            Bird::African { number_of_coconuts } => 40.0 - 3.0 * *number_of_coconuts as f64,
            Bird::NorwegianBlue { voltage } => if *voltage < 10.0 { 0.0 } else { 24.0 },
        }
    }

    fn plumage(&self) -> &str {
        match self {
            Bird::European => "average",
            Bird::African { number_of_coconuts } => {
                if *number_of_coconuts > 2 { "tired" } else { "average" }
            }
            Bird::NorwegianBlue { voltage } => {
                if *voltage > 50.0 { "beautiful" } else { "scorched" }
            }
        }
    }
}

// Alternative: trait-based (when types are open-ended)
// trait Bird { fn speed(&self) -> f64; fn plumage(&self) -> &str; }
```

## Related Smells

Repeated Switches, Long Method, Primitive Obsession

## Inverse

(none)
