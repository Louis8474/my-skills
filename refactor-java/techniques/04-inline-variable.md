# Inline Variable

**Category:** Composing Methods
**Sources:** Fowler Ch.6, Shvets Ch.6
**Also known as:** Inline Temp

## Problem

A variable's name doesn't communicate more than the expression itself. The variable adds no clarity.

## Motivation

Sometimes a variable is assigned only once from a simple expression, and the variable name adds nothing over the expression. In that case, the variable is just noise — remove it by inlining the expression at the point of use.

## Java 8 Example

```java
// BEFORE: the variable adds nothing
double basePrice = order.basePrice();
return basePrice > 1000;

// AFTER: expression is already clear
return order.basePrice() > 1000;
```

## Java 11 Example

```java
// BEFORE: unnecessary intermediate variables
var customerName = customer.getName();
var greeting = "Hello, " + customerName;
return greeting;

// AFTER: inlined — reads just as clearly
return "Hello, " + customer.getName();
```

## Related Smells

Lazy Element

## Inverse

Extract Variable (technique #03)
