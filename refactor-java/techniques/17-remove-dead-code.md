# Remove Dead Code

**Category:** Moving Features  
**Sources:** Fowler Ch.8

## Problem

There's code that is never executed — commented-out blocks, unused methods, unreachable branches, or variables assigned but never read.

## Motivation

Dead code confuses readers ("Why is this here? Is it important?"), wastes mental cycles during maintenance, and creates an illusion of complexity. With modern version control, you can always recover it from history. Delete it.

## Java 8 / Java 11 Example

```java
// BEFORE: dead code scattered around
class OrderProcessor {
    // Unused constant from old business rule
    private static final double OLD_TAX_RATE = 0.15;

    public void processOrder(Order order) {
        validate(order);
        // calculateLegacyDiscount(order); // Old code, left "just in case"
        calculatePrice(order);
        // if (false) { debugPrint(order); } // Debug code left behind
        submitOrder(order);
    }

    // This method is never called from anywhere
    private void calculateLegacyDiscount(Order order) {
        // 50 lines of old discount logic
    }

    // Also never called
    private void debugPrint(Order order) {
        System.out.println("DEBUG: " + order);
    }
}

// AFTER: clean — only code that runs
class OrderProcessor {
    public void processOrder(Order order) {
        validate(order);
        calculatePrice(order);
        submitOrder(order);
    }
}
```

## How to Find Dead Code

Use your IDE's "Find Usages" feature, or run static analysis tools like SpotBugs, SonarQube, or IntelliJ's built-in inspection "Unused declaration".

## Related Smells

Speculative Generality, Comments (commented-out code)\n