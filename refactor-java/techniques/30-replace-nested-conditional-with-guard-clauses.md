# Replace Nested Conditional with Guard Clauses

**Category:** Simplifying Conditionals  
**Sources:** Fowler Ch.10, Shvets Ch.9

## Problem

A method has deep nesting with if/else chains. The "happy path" is buried under layers of indentation.

## Motivation

Guard Clauses use early returns to handle special cases at the top of a method. This eliminates nesting and makes the normal flow visible. Each guard clause says: "this is a special case — handle it and exit." Everything after the guards is the main logic.

## Java 8 Example

```java
// BEFORE: deeply nested if/else
double getPayAmount() {
    double result;
    if (isDead) {
        result = deadAmount();
    } else {
        if (isSeparated) {
            result = separatedAmount();
        } else {
            if (isRetired) {
                result = retiredAmount();
            } else {
                result = normalPayAmount();
            }
        }
    }
    return result;
}

// AFTER: guard clauses — flat, readable, each case is explicit
double getPayAmount() {
    if (isDead) return deadAmount();
    if (isSeparated) return separatedAmount();
    if (isRetired) return retiredAmount();
    return normalPayAmount();
}
```

## Java 11 Example

```java
// BEFORE: nested validation
public Optional<Order> processOrder(OrderRequest request) {
    if (request != null) {
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            if (request.getCustomerId() != null) {
                var customer = customerRepo.findById(request.getCustomerId());
                if (customer.isPresent()) {
                    if (customer.get().isActive()) {
                        // Finally! The actual business logic
                        return Optional.of(createOrder(customer.get(), request));
                    }
                }
            }
        }
    }
    return Optional.empty();
}

// AFTER: guard clauses make the happy path obvious
public Optional<Order> processOrder(OrderRequest request) {
    if (request == null) return Optional.empty();
    if (request.getItems() == null || request.getItems().isEmpty()) return Optional.empty();
    if (request.getCustomerId() == null) return Optional.empty();

    var customer = customerRepo.findById(request.getCustomerId());
    if (customer.isEmpty()) return Optional.empty();        // Java 11 isEmpty()
    if (!customer.get().isActive()) return Optional.empty();

    // Happy path — clear and at the base indentation level
    return Optional.of(createOrder(customer.get(), request));
}
```

## Related Smells

Long Method, Comments (explaining which branch is the "real" logic)
