# Collapse Hierarchy

**Category:** Dealing with Inheritance  
**Sources:** Fowler Ch.12, Shvets Ch.11

## Problem

A superclass and subclass are not significantly different. The subclass doesn't add meaningful behavior or data.

## Motivation

Over time, refactorings may reduce a subclass to the point where it has no meaningful distinction from its parent. Merge them into one class to simplify the hierarchy.

## Java 8 / Java 11 Example

```java
// BEFORE: subclass adds nothing meaningful
class Employee {
    private String name;
    private double salary;
    String getName() { return name; }
    double getSalary() { return salary; }
}

class SalariedEmployee extends Employee {
    // No additional behavior or data — it's identical to Employee
}

// AFTER: collapsed into a single class
class Employee {
    private String name;
    private double salary;
    String getName() { return name; }
    double getSalary() { return salary; }
}
```

## Related Smells

Lazy Class, Speculative Generality

## Inverse

Extract Superclass / Extract Subclass
