# Replace Subclass with Delegate

**Category:** Dealing with Generalization
**Sources:** Fowler Ch.12

## Problem

Inheritance is being used for specialization, but the inheritance hierarchy is too rigid. You can only inherit from one class, the type is fixed at creation time, and adding variation axes requires combinatorial subclassing (e.g., PremiumBooking, EuropeanBooking, PremiumEuropeanBooking).

## Motivation

Delegation (composition) is more flexible than inheritance: you can change the delegate at runtime, combine multiple variation axes independently, and avoid deep hierarchies. When a subclass exists only to vary a few behaviors, replacing it with a delegate object that implements those behaviors gives you the same polymorphism without the rigidity of inheritance.

## When to Apply

- You need to change the "type" of an object at runtime
- Multiple independent variation axes would require combinatorial subclassing
- The subclass overrides only a few methods
- Inheritance is creating coupling that makes the code hard to evolve
- You want to apply the Strategy or State pattern

## Mechanics

1. Create a delegate class (or interface) for the varying behavior
2. Add a delegate field to the host class
3. Move the overridden methods from the subclass into the delegate
4. Have the host class forward calls to the delegate
5. Remove the subclass
6. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Booking:
    def __init__(self, show: str, date: str):
        self.show = show
        self.date = date

    def base_price(self) -> float:
        return 100.0

class PremiumBooking(Booking):
    def __init__(self, show: str, date: str, extras: list[str]):
        super().__init__(show, date)
        self.extras = extras

    def base_price(self) -> float:
        return super().base_price() + 50.0

    def has_dinner(self) -> bool:
        return "dinner" in self.extras

# AFTER
class PremiumDelegate:
    def __init__(self, host: "Booking", extras: list[str]):
        self._host = host
        self.extras = extras

    def extend_base_price(self, base: float) -> float:
        return base + 50.0

    def has_dinner(self) -> bool:
        return "dinner" in self.extras

class Booking:
    def __init__(self, show: str, date: str, premium_extras: list[str] | None = None):
        self.show = show
        self.date = date
        self._premium = PremiumDelegate(self, premium_extras) if premium_extras else None

    def base_price(self) -> float:
        price = 100.0
        if self._premium:
            price = self._premium.extend_base_price(price)
        return price

    def has_dinner(self) -> bool:
        return self._premium.has_dinner() if self._premium else False
```

### TypeScript

```typescript
// BEFORE
class Booking {
  constructor(public show: string, public date: string) {}
  basePrice(): number { return 100; }
}

class PremiumBooking extends Booking {
  constructor(show: string, date: string, private extras: string[]) {
    super(show, date);
  }
  basePrice(): number { return super.basePrice() + 50; }
  hasDinner(): boolean { return this.extras.includes("dinner"); }
}

// AFTER
interface BookingDelegate {
  extendBasePrice(base: number): number;
  hasDinner(): boolean;
}

class PremiumDelegate implements BookingDelegate {
  constructor(private extras: string[]) {}
  extendBasePrice(base: number): number { return base + 50; }
  hasDinner(): boolean { return this.extras.includes("dinner"); }
}

class Booking {
  private delegate?: BookingDelegate;

  constructor(public show: string, public date: string) {}

  setPremium(extras: string[]): void {
    this.delegate = new PremiumDelegate(extras);
  }

  basePrice(): number {
    const base = 100;
    return this.delegate ? this.delegate.extendBasePrice(base) : base;
  }

  hasDinner(): boolean {
    return this.delegate?.hasDinner() ?? false;
  }
}
```

### Go

```go
// Go already uses composition over inheritance — this is the default approach.

type BookingDelegate interface {
	ExtendBasePrice(base float64) float64
	HasDinner() bool
}

type PremiumDelegate struct {
	Extras []string
}

func (d *PremiumDelegate) ExtendBasePrice(base float64) float64 { return base + 50 }

func (d *PremiumDelegate) HasDinner() bool {
	for _, e := range d.Extras {
		if e == "dinner" { return true }
	}
	return false
}

type Booking struct {
	Show     string
	Date     string
	delegate BookingDelegate // nil for standard bookings
}

func (b *Booking) BasePrice() float64 {
	base := 100.0
	if b.delegate != nil {
		base = b.delegate.ExtendBasePrice(base)
	}
	return base
}

func (b *Booking) HasDinner() bool {
	if b.delegate != nil {
		return b.delegate.HasDinner()
	}
	return false
}
```

### Rust

```rust
// Rust already uses composition over inheritance — this is the default approach.

trait BookingDelegate {
    fn extend_base_price(&self, base: f64) -> f64;
    fn has_dinner(&self) -> bool;
}

struct PremiumDelegate {
    extras: Vec<String>,
}

impl BookingDelegate for PremiumDelegate {
    fn extend_base_price(&self, base: f64) -> f64 { base + 50.0 }
    fn has_dinner(&self) -> bool { self.extras.iter().any(|e| e == "dinner") }
}

struct Booking {
    show: String,
    date: String,
    delegate: Option<Box<dyn BookingDelegate>>,
}

impl Booking {
    fn base_price(&self) -> f64 {
        let base = 100.0;
        match &self.delegate {
            Some(d) => d.extend_base_price(base),
            None => base,
        }
    }

    fn has_dinner(&self) -> bool {
        self.delegate.as_ref().map_or(false, |d| d.has_dinner())
    }
}
```

## Language Notes

- **Go**: Go has no inheritance, so composition with interfaces is already the standard approach. The delegate pattern shown here is idiomatic Go — use an interface field that may be `nil` for default behavior.
- **Rust**: Rust has no inheritance, so trait objects (`Box<dyn Trait>`) wrapped in `Option` provide the same delegate flexibility. This is the idiomatic way to vary behavior at runtime.

## Related Smells

Refused Bequest, Speculative Generality

## Inverse

(none)
