# Decompose Conditional

**Category:** Simplifying Conditionals  
**Sources:** Fowler Ch.10, Shvets Ch.9

## Problem

You have a complex conditional (if-then-else) where the condition, the then-branch, or the else-branch contain non-trivial logic. Readers must analyze each part to understand the intent.

## Motivation

Complex conditionals are one of the biggest readability killers. Decomposing extracts each part into a method whose name describes the purpose. The reader then sees "if notSummer → winterCharge, else → summerCharge" instead of decoding date comparisons and rate calculations.

## Java 8 Example

```java
// BEFORE: condition and branches are opaque
double charge;
if (date.before(SUMMER_START) || date.after(SUMMER_END)) {
    charge = quantity * winterRate + winterServiceCharge;
} else {
    charge = quantity * summerRate;
}

// AFTER: named methods communicate intent
double charge = isWinter(date) ? winterCharge(quantity) : summerCharge(quantity);

private boolean isWinter(Date date) {
    return date.before(SUMMER_START) || date.after(SUMMER_END);
}

private double winterCharge(int quantity) {
    return quantity * winterRate + winterServiceCharge;
}

private double summerCharge(int quantity) {
    return quantity * summerRate;
}
```

## Java 11 Example

```java
// BEFORE: complex eligibility check
public boolean isEligibleForPromotion(Employee emp) {
    if (emp.getYearsOfService() >= 3
            && emp.getPerformanceScore() > 4.0
            && !emp.getDisciplinaryActions().isEmpty() == false
            && emp.getDepartment().hasOpenPositions()) {
        return emp.getManager().approves(emp)
                && emp.getTrainingHours() >= 40;
    }
    return false;
}

// AFTER: each sub-condition is a named predicate
public boolean isEligibleForPromotion(Employee emp) {
    return meetsMinimumRequirements(emp)
        && hasManagerApproval(emp)
        && hasRequiredTraining(emp);
}

private boolean meetsMinimumRequirements(Employee emp) {
    return emp.getYearsOfService() >= 3
        && emp.getPerformanceScore() > 4.0
        && emp.getDisciplinaryActions().isEmpty()
        && emp.getDepartment().hasOpenPositions();
}

private boolean hasManagerApproval(Employee emp) {
    return emp.getManager().approves(emp);
}

private boolean hasRequiredTraining(Employee emp) {
    return emp.getTrainingHours() >= 40;
}
```

## Related Smells

Long Method, Comments (explaining complex conditions)
