# Combine Functions into Transform

**Category:** Additional Techniques  
**Sources:** Fowler Ch.6

## Problem

Multiple clients compute derived data from the same source data, duplicating the derivation logic.

## Motivation

An alternative to Combine Functions into Class: create a transformation function that takes the source data and returns an enriched version with derived fields. Best when the data is read-only and you want a snapshot with all computed values.

## Java 8 Example

```java
// BEFORE: each client computes derived values
// Client 1: double base = reading.quantity * baseRate(reading.month, reading.year);
// Client 2: double base = reading.quantity * baseRate(reading.month, reading.year); // Duplicate!

// AFTER: enriching transform
EnrichedReading enrichReading(Reading original) {
    double baseCharge = original.quantity * baseRate(original.month, original.year);
    double taxableCharge = Math.max(0, baseCharge - taxThreshold(original.year));
    return new EnrichedReading(original, baseCharge, taxableCharge);
}

// All clients use the enriched version
EnrichedReading enriched = enrichReading(rawReading);
double base = enriched.getBaseCharge();      // No duplication
double tax = enriched.getTaxableCharge();    // Pre-calculated
```

## When to Use Class vs. Transform

Use **Class** when the data is mutable (the class keeps derivations consistent). Use **Transform** when the data is read-only and you want an immutable snapshot with all computed values.

## Related Smells

Duplicated Code, Scattered derived calculations
