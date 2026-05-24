# Combine Functions into Class

**Category:** Additional Techniques  
**Sources:** Fowler Ch.6

## Problem

Several functions operate on the same data, often passed around as parameters. They form a conceptual group but have no shared home.

## Motivation

When a group of functions all transform or query the same data, they naturally belong together in a class. The shared data becomes fields, the functions become methods, and you get a cohesive unit that can hold derived values, apply validations, and maintain invariants.

## Java 8 Example

```java
// BEFORE: scattered functions operating on reading data
double baseRate(int month, int year) { /* ... */ }
double baseCharge(Reading reading) { return baseRate(reading.month, reading.year) * reading.quantity; }
double taxableCharge(Reading reading) { return Math.max(0, baseCharge(reading) - taxThreshold(reading.year)); }

// AFTER: combined into a class
class Reading {
    private final int month;
    private final int year;
    private final int quantity;

    Reading(int month, int year, int quantity) {
        this.month = month;
        this.year = year;
        this.quantity = quantity;
    }

    double getBaseCharge() {
        return baseRate(month, year) * quantity;
    }

    double getTaxableCharge() {
        return Math.max(0, getBaseCharge() - taxThreshold(year));
    }

    private double baseRate(int month, int year) { /* ... */ }
    private double taxThreshold(int year) { /* ... */ }
}
```

## Related Smells

Long Parameter List, Data Clumps, Feature Envy
