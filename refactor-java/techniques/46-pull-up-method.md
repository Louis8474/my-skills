# Pull Up Method / Pull Up Field

**Category:** Dealing with Inheritance  
**Sources:** Fowler Ch.12, Shvets Ch.11

## Problem

Two or more subclasses have the same method (identical or near-identical logic). The duplication lives in multiple places.

## Motivation

When subclasses share identical behavior, the natural home for that behavior is the superclass. Pull Up Method eliminates duplication and ensures that changes need to happen in only one place. Pull Up Field does the same for shared fields.

## Java 8 Example

```java
// BEFORE: duplicated method in both subclasses
class Engineer extends Employee {
    String getTitle() { return "Engineer"; }
    double getAnnualCost() { return 12 * monthlyCost; }
}

class Manager extends Employee {
    String getTitle() { return "Manager"; }
    double getAnnualCost() { return 12 * monthlyCost; } // Duplicate!
}

// AFTER: shared method pulled up to Employee
abstract class Employee {
    protected double monthlyCost;

    // Common logic lives in the superclass
    double getAnnualCost() { return 12 * monthlyCost; }

    // Subclasses only define what differs
    abstract String getTitle();
}

class Engineer extends Employee {
    @Override String getTitle() { return "Engineer"; }
}

class Manager extends Employee {
    @Override String getTitle() { return "Manager"; }
}
```

## Java 11 Example

```java
// BEFORE: duplicated validation in subclasses
class CreditCardPayment extends Payment {
    void validate() {
        Objects.requireNonNull(amount, "Amount required");
        if (amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Amount must be positive");
        // Credit-card-specific validation
        if (cardNumber.isBlank()) throw new IllegalArgumentException("Card number required");
    }
}

class BankTransferPayment extends Payment {
    void validate() {
        Objects.requireNonNull(amount, "Amount required");  // Duplicate!
        if (amount.compareTo(BigDecimal.ZERO) <= 0)         // Duplicate!
            throw new IllegalArgumentException("Amount must be positive");
        // Bank-transfer-specific validation
        if (accountNumber.isBlank()) throw new IllegalArgumentException("Account required");
    }
}

// AFTER: common validation pulled up, subclass adds specifics
abstract class Payment {
    protected BigDecimal amount;

    void validate() {
        Objects.requireNonNull(amount, "Amount required");
        if (amount.compareTo(BigDecimal.ZERO) <= 0)
            throw new IllegalArgumentException("Amount must be positive");
        validateSpecific(); // Template Method pattern
    }

    protected abstract void validateSpecific();
}

class CreditCardPayment extends Payment {
    @Override protected void validateSpecific() {
        if (cardNumber.isBlank()) throw new IllegalArgumentException("Card number required");
    }
}
```

## Related Smells

Duplicated Code

## Inverse

Push Down Method (technique #47)
