# Extract Superclass

**Category:** Dealing with Inheritance  
**Sources:** Fowler Ch.12, Shvets Ch.11

## Problem

Two or more classes share common fields and methods but have no common parent (other than Object). You're seeing Duplicated Code across classes.

## Motivation

When two classes look alike, create a superclass to hold the shared parts. This is a natural refactoring when you discover an "is-a" relationship that wasn't originally designed in.

## Java 8 Example

```java
// BEFORE: Department and Employee both have name and annualCost
class Department {
    private String name;
    private List<Employee> staff;
    String getName() { return name; }
    double getAnnualCost() { return staff.stream().mapToDouble(Employee::getSalary).sum(); }
}

class Employee {
    private String name;
    private double salary;
    String getName() { return name; }
    double getAnnualCost() { return salary; }
}

// AFTER: common interface extracted
abstract class Party {
    protected String name;
    String getName() { return name; }
    abstract double getAnnualCost();
}

class Department extends Party {
    private List<Employee> staff;
    @Override double getAnnualCost() {
        return staff.stream().mapToDouble(Employee::getAnnualCost).sum();
    }
}

class Employee extends Party {
    private double salary;
    @Override double getAnnualCost() { return salary; }
}
```

## Related Smells

Duplicated Code, Alternative Classes with Different Interfaces
