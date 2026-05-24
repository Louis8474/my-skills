# Remove Flag Argument

**Category:** Simplifying Method Calls  
**Sources:** Fowler Ch.11

## Problem

A method takes a boolean parameter that changes its behavior. Callers write things like `bookRoom(customer, true)` — what does `true` mean?

## Motivation

Boolean flags are a code smell because they say "this function does two different things." The caller must know what `true` and `false` mean. Create two separate methods with descriptive names instead. The caller's intent becomes explicit.

## Java 8 Example

```java
// BEFORE: flag argument — what does 'true' mean?
void setDimension(String name, int value, boolean isMetric) {
    if (isMetric) {
        dimensions.put(name, value);
    } else {
        dimensions.put(name, (int)(value * 2.54));
    }
}
// Client: setDimension("width", 10, true); // Unclear!

// AFTER: two explicit methods
void setDimensionInCm(String name, int value) {
    dimensions.put(name, value);
}

void setDimensionInInches(String name, int value) {
    dimensions.put(name, (int)(value * 2.54));
}
// Client: setDimensionInCm("width", 10); // Crystal clear!
```

## Java 11 Example

```java
// BEFORE
Order createOrder(Customer customer, boolean rushDelivery) { ... }
// Client: createOrder(customer, true); // What is true?

// AFTER
Order createStandardOrder(Customer customer) { ... }
Order createRushOrder(Customer customer) { ... }
// Client: createRushOrder(customer); // Self-documenting
```

## Related Smells

Long Parameter List, Mysterious Name (at the call site)
