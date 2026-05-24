# Replace Parameter with Query

**Category:** Simplifying Method Calls  
**Sources:** Fowler Ch.11

## Problem

A parameter passed to a method can be calculated from data already available inside the method. The caller is doing work that the method could do itself.

## Motivation

If the callee can derive the value from its own state or other parameters, remove the parameter and let the callee compute it. This simplifies the call site. The trade-off: this adds a dependency from the callee to whatever it queries.

## Java 8 Example

```java
// BEFORE: caller computes discountLevel unnecessarily
double finalPrice() {
    double basePrice = quantity * itemPrice;
    int discountLevel = (quantity > 100) ? 2 : 1;
    return discountedPrice(basePrice, discountLevel);
}

// AFTER: method computes what it needs
double finalPrice() {
    double basePrice = quantity * itemPrice;
    return discountedPrice(basePrice);
}

private double discountedPrice(double basePrice) {
    int discountLevel = (quantity > 100) ? 2 : 1; // Computed internally
    return (discountLevel == 2) ? basePrice * 0.9 : basePrice * 0.95;
}
```

## Inverse

Replace Query with Parameter (technique #41)
