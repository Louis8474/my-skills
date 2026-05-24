# Replace Temp with Query

**Category:** Composing Methods
**Sources:** Fowler Ch.6-7, Shvets Ch.6

## Problem

You're using a temporary variable to hold the result of an expression. This temp prevents extraction of methods because the temp is referenced in later code.

## Motivation

Temporary variables are a barrier to Extract Method: they create hidden data flow inside a method. By replacing a temp with a query (a method call), you make the value available to any method in the class, enable further extraction, and improve readability.

## Java 8 Example

```java
// BEFORE: temp variables block further extraction
public double getPrice() {
    double basePrice = quantity * itemPrice;
    double discountFactor;
    if (basePrice > 1000) {
        discountFactor = 0.95;
    } else {
        discountFactor = 0.98;
    }
    return basePrice * discountFactor;
}

// AFTER: temps replaced with query methods
public double getPrice() {
    return getBasePrice() * getDiscountFactor();
}

private double getBasePrice() {
    return quantity * itemPrice;
}

private double getDiscountFactor() {
    // Now getBasePrice() is reusable across the class
    return getBasePrice() > 1000 ? 0.95 : 0.98;
}
```

## Java 11 Example

```java
// BEFORE: temp in a service class
public OrderSummary calculateSummary(Order order) {
    var items = order.getItems();
    var subtotal = items.stream()
            .mapToDouble(Item::getPrice)
            .sum();
    var tax = subtotal * getTaxRate(order.getRegion());
    var shipping = subtotal > 100 ? 0 : 9.99;
    return new OrderSummary(subtotal, tax, shipping);
}

// AFTER: query methods — each calculation is independently accessible
public OrderSummary calculateSummary(Order order) {
    return new OrderSummary(
        calculateSubtotal(order),
        calculateTax(order),
        calculateShipping(order)
    );
}

private double calculateSubtotal(Order order) {
    return order.getItems().stream()
            .mapToDouble(Item::getPrice)
            .sum();
}

private double calculateTax(Order order) {
    return calculateSubtotal(order) * getTaxRate(order.getRegion());
}

private double calculateShipping(Order order) {
    return calculateSubtotal(order) > 100 ? 0 : 9.99;
}
```

## Caution

Only apply when the expression has no side effects and returns the same value each time. For performance-critical code where the expression is expensive, keep the temp and document why.

## Related Smells

Long Method, Duplicated Code
