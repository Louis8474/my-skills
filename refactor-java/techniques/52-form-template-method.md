# Form Template Method

**Category:** Dealing with Inheritance  
**Sources:** Shvets Ch.11

## Problem

Two subclasses have methods with similar overall structure but different details in some steps. The high-level algorithm is the same; only specific steps differ.

## Motivation

The Template Method pattern (from GoF) defines the skeleton of an algorithm in the superclass and lets subclasses override specific steps. This eliminates duplication of the algorithm structure while allowing customization of individual steps.

## Java 8 Example

```java
// BEFORE: similar structure duplicated in subclasses
class ResidentialSite {
    double getBillableAmount() {
        double base = units * rate;
        double tax = base * 0.1;
        return base + tax;
    }
}

class LifelineSite {
    double getBillableAmount() {
        double base = units * rate * 0.5;  // Different base calculation
        double tax = base * 0.05;          // Different tax rate
        return base + tax;
    }
}

// AFTER: Template Method in superclass
abstract class Site {
    protected int units;
    protected double rate;

    // Template Method — defines the algorithm skeleton
    final double getBillableAmount() {
        double base = getBaseAmount();
        double tax = getTaxAmount(base);
        return base + tax;
    }

    // Steps that vary are abstract
    protected abstract double getBaseAmount();
    protected abstract double getTaxAmount(double base);
}

class ResidentialSite extends Site {
    @Override protected double getBaseAmount() { return units * rate; }
    @Override protected double getTaxAmount(double base) { return base * 0.1; }
}

class LifelineSite extends Site {
    @Override protected double getBaseAmount() { return units * rate * 0.5; }
    @Override protected double getTaxAmount(double base) { return base * 0.05; }
}
```

## Related Smells

Duplicated Code (in subclasses), Long Method
