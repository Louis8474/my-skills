# Replace Subclass with Delegate

**Category:** Dealing with Inheritance  
**Sources:** Fowler Ch.12

## Problem

You're using inheritance for specialization, but inheritance is too rigid: you can only inherit from one class, and the type is fixed at creation time.

## Motivation

Delegation (composition) provides the same specialization benefits as inheritance but with more flexibility. Delegates can be swapped at runtime, an object can use multiple delegates, and you're not locked into a single inheritance chain. Fowler's general tendency: prefer composition over inheritance.

## Java 8 Example

```java
// BEFORE: inheritance-based specialization
class Booking {
    protected Show show;
    protected LocalDate date;
    boolean hasTalkback() { return show.hasOwnProperty("talkback"); }
    double getBasePrice() { return show.getPrice(); }
}

class PremiumBooking extends Booking {
    private Extras extras;
    @Override boolean hasTalkback() { return show.hasOwnProperty("talkback"); }
    @Override double getBasePrice() { return Math.round(super.getBasePrice() + extras.getPremiumFee()); }
    boolean hasDinner() { return extras.hasDinner(); }
}

// AFTER: delegation — more flexible
class Booking {
    private Show show;
    private LocalDate date;
    private PremiumDelegate premiumDelegate; // null if not premium

    boolean hasTalkback() {
        return (premiumDelegate != null)
            ? premiumDelegate.hasTalkback()
            : show.hasOwnProperty("talkback");
    }

    double getBasePrice() {
        return (premiumDelegate != null)
            ? premiumDelegate.extendBasePrice(show.getPrice())
            : show.getPrice();
    }

    boolean hasDinner() {
        return premiumDelegate != null && premiumDelegate.hasDinner();
    }
}

class PremiumDelegate {
    private Extras extras;
    boolean hasTalkback() { return true; } // Premium always has talkback
    double extendBasePrice(double base) { return Math.round(base + extras.getPremiumFee()); }
    boolean hasDinner() { return extras.hasDinner(); }
}
```

## Related Smells

Refused Bequest, Speculative Generality (deep hierarchies)
