# Replace Derived Variable with Query

**Category:** Organizing Data  
**Sources:** Fowler Ch.9

## Problem

A field stores a value that can be calculated from other data. The stored value can go stale when its dependencies change.

## Motivation

Mutable data that is derived from other data is a synchronization bug waiting to happen. If the source data changes and you forget to update the derived value, you get inconsistent state. Calculate it on demand instead.

## Java 8 Example

```java
// BEFORE: derived field that can go stale
class ProductionPlan {
    private double production;
    private List<Adjustment> adjustments = new ArrayList<>();

    void applyAdjustment(Adjustment adjustment) {
        adjustments.add(adjustment);
        production += adjustment.getAmount(); // Must remember to update!
    }

    double getProduction() { return production; }
}

// AFTER: calculated on demand — always consistent
class ProductionPlan {
    private List<Adjustment> adjustments = new ArrayList<>();

    void applyAdjustment(Adjustment adjustment) {
        adjustments.add(adjustment);
    }

    // Always correct, never stale
    double getProduction() {
        return adjustments.stream()
                .mapToDouble(Adjustment::getAmount)
                .sum();
    }
}
```

## Java 11 Example

```java
// BEFORE: cached total updated manually
class ShoppingCart {
    private final List<CartItem> items = new ArrayList<>();
    private double totalPrice; // derived — bug-prone

    void addItem(CartItem item) {
        items.add(item);
        totalPrice += item.getPrice() * item.getQuantity();
    }

    void removeItem(CartItem item) {
        items.remove(item);
        totalPrice -= item.getPrice() * item.getQuantity(); // What if price changed?
    }
}

// AFTER: query replaces stored value
class ShoppingCart {
    private final List<CartItem> items = new ArrayList<>();

    void addItem(CartItem item) { items.add(item); }
    void removeItem(CartItem item) { items.remove(item); }

    double getTotalPrice() {
        return items.stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();
    }
}
```

## Caution

If the calculation is expensive and called frequently, consider caching with invalidation, but default to querying — premature optimization is the root of all evil.

## Related Smells

Mutable Data\n