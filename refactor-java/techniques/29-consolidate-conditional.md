# Consolidate Conditional Expression

**Category:** Simplifying Conditionals  
**Sources:** Fowler Ch.10, Shvets Ch.9

## Problem

Multiple conditions lead to the same result. Each condition is checked separately but they all do the same thing.

## Motivation

When several conditions share the same outcome, merge them into a single expression and extract it into a named method. This eliminates redundancy and gives the combined check a descriptive name that explains why these cases are grouped.

## Java 8 Example

```java
// BEFORE: multiple separate checks with same result
double disabilityAmount(Employee emp) {
    if (emp.getSeniority() < 2) return 0;
    if (emp.getMonthsDisabled() > 12) return 0;
    if (emp.isPartTime()) return 0;
    // ... calculate actual amount
    return emp.getSalary() * 0.6;
}

// AFTER: consolidated into a single named check
double disabilityAmount(Employee emp) {
    if (isNotEligibleForDisability(emp)) return 0;
    return emp.getSalary() * 0.6;
}

private boolean isNotEligibleForDisability(Employee emp) {
    return emp.getSeniority() < 2
        || emp.getMonthsDisabled() > 12
        || emp.isPartTime();
}
```

## Java 11 Example

```java
// BEFORE: scattered conditions with same outcome
boolean shouldSkipProcessing(Order order) {
    if (order.getItems().isEmpty()) return true;
    if (order.getCustomer() == null) return true;
    if ("CANCELLED".equals(order.getStatus())) return true;
    if ("DRAFT".equals(order.getStatus())) return true;
    return false;
}

// AFTER: consolidated with Predicate chaining
private static final Set<String> SKIP_STATUSES = Set.of("CANCELLED", "DRAFT"); // Java 11

boolean shouldSkipProcessing(Order order) {
    return isInvalidOrder(order);
}

private boolean isInvalidOrder(Order order) {
    return order.getItems().isEmpty()
        || order.getCustomer() == null
        || SKIP_STATUSES.contains(order.getStatus());
}
```

## Related Smells

Duplicated Code, Long Method
