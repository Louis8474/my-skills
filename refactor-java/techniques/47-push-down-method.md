# Push Down Method / Push Down Field

**Category:** Dealing with Inheritance  
**Sources:** Fowler Ch.12, Shvets Ch.11

## Problem

A method in a superclass is only relevant to one (or a few) subclasses. The superclass has behavior that doesn't belong to all its children.

## Motivation

A superclass should only contain behavior common to all subclasses. If a method is specific to one subclass, push it down to that subclass. This clarifies the superclass interface and makes it obvious which subclass has which capability.

## Java 8 Example

```java
// BEFORE: method in superclass only used by one subclass
abstract class Employee {
    double getQuota() { /* only relevant for Salesperson */ }
    abstract double getBonus();
}

// AFTER: pushed down to where it belongs
abstract class Employee {
    abstract double getBonus();
}

class Salesperson extends Employee {
    double getQuota() { return monthlyTarget * 12; } // Only here
    @Override double getBonus() { return getQuota() * 0.1; }
}

class Engineer extends Employee {
    @Override double getBonus() { return salary * 0.05; }
}
```

## Related Smells

Refused Bequest (subclass ignoring inherited methods)

## Inverse

Pull Up Method (technique #46)
