# Extract Variable

**Category:** Composing Methods
**Sources:** Fowler Ch.6, Shvets Ch.6
**Also known as:** Introduce Explaining Variable

## Problem

You have a complex expression that is hard to understand. Its meaning is buried in computation.

## Motivation

Complex expressions — especially long conditionals or compound calculations — are hard to read. Extracting parts into named local variables gives each piece a descriptive label, making the overall expression self-documenting. It's a stepping stone toward Extract Method.

## Java 8 Example

```java
// BEFORE: opaque expression
if (order.getQuantity() * order.getItemPrice()
    - Math.max(0, order.getQuantity() - 500) * order.getItemPrice() * 0.05
    + Math.min(order.getQuantity() * order.getItemPrice() * 0.1, 100) > 1000) {
    // apply premium discount
}

// AFTER: named variables explain each component
double basePrice = order.getQuantity() * order.getItemPrice();
double quantityDiscount = Math.max(0, order.getQuantity() - 500) * order.getItemPrice() * 0.05;
double shipping = Math.min(basePrice * 0.1, 100);

if (basePrice - quantityDiscount + shipping > 1000) {
    // apply premium discount — now the reader understands why
}
```

## Java 11 Example

```java
// BEFORE: nested stream with complex predicate
var results = transactions.stream()
    .filter(t -> t.getAmount().compareTo(BigDecimal.valueOf(1000)) > 0
              && t.getDate().isAfter(LocalDate.now().minusDays(30))
              && !t.getStatus().equals("CANCELLED"))
    .collect(Collectors.toList());

// AFTER: extracted predicates with meaningful names
var minAmount = BigDecimal.valueOf(1000);
var thirtyDaysAgo = LocalDate.now().minusDays(30);

// Each predicate is a named local variable using var (Java 11)
var isHighValue = (Predicate<Transaction>) t -> t.getAmount().compareTo(minAmount) > 0;
var isRecent = (Predicate<Transaction>) t -> t.getDate().isAfter(thirtyDaysAgo);
var isActive = (Predicate<Transaction>) t -> !"CANCELLED".equals(t.getStatus());

var results = transactions.stream()
    .filter(isHighValue.and(isRecent).and(isActive))
    .collect(Collectors.toList());
```

## Related Smells

Long Method, Comments (as deodorant for expressions)

## Inverse

Inline Variable (technique #04)
