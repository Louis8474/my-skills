# Introduce Assertion

**Category:** Simplifying Conditionals  
**Sources:** Fowler Ch.10, Shvets Ch.9

## Problem

A section of code only works correctly if certain conditions are true, but these conditions are not documented or checked.

## Motivation

Assertions make assumptions explicit and executable. They document what the developer expects to be true at a certain point. If the assertion fails, it signals a programming error (not a user input error — use validation for that). Assertions are communication tools that help future developers (and yourself) understand invariants.

## Java 8 Example

```java
// BEFORE: hidden assumption about positive salary
class Employee {
    void applyDiscount(double discountRate) {
        // Assumes discountRate is between 0 and 1, but nothing enforces it
        this.salary = salary * (1 - discountRate);
    }
}

// AFTER: assertion documents the precondition
class Employee {
    void applyDiscount(double discountRate) {
        assert discountRate >= 0 && discountRate <= 1
            : "Discount rate must be between 0 and 1, got: " + discountRate;
        assert salary > 0 : "Salary must be positive before discount";
        this.salary = salary * (1 - discountRate);
    }
}
```

## Java 11 Example — using Objects.requireNonNull and Preconditions

```java
// For public APIs, use explicit checks (not assert, which can be disabled)
class OrderService {
    Order createOrder(Customer customer, List<Item> items) {
        // Preconditions (these always run, unlike assert)
        Objects.requireNonNull(customer, "Customer must not be null");
        Objects.requireNonNull(items, "Items must not be null");
        if (items.isEmpty()) {
            throw new IllegalArgumentException("Order must have at least one item");
        }

        // Internal invariant check (assert is fine for internal logic)
        var total = items.stream().mapToDouble(Item::getPrice).sum();
        assert total >= 0 : "Total price should never be negative: " + total;

        return new Order(customer, List.copyOf(items), total);
    }
}
```

## Assertions vs. Validation

Assertions are for **programmer errors** (invariants that should never be violated). Validation is for **user input** (data that might legitimately be wrong). Use `assert` for invariants, use `throw new IllegalArgumentException` for public API validation.

## Related Smells

Comments (explaining what must be true), Mysterious bugs from violated assumptions
