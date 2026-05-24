# Remove Middle Man

**Category:** Moving Features  
**Sources:** Fowler Ch.7, Shvets Ch.7

## Problem

A class has too many delegating methods that do nothing but forward calls to another object. The class has become a "Middle Man" with no real behavior of its own.

## Motivation

Hide Delegate can be overdone. If most of a class's methods simply forward to another object, the class is just a pass-through adding complexity without value. Let clients access the delegate directly. It's a balance — choose based on how much of the interface is pure delegation.

## Java 8 Example

```java
// BEFORE: Person is pure middleman for Department
class Person {
    private Department department;
    Manager getManager() { return department.getManager(); }
    String getDeptName() { return department.getName(); }
    int getDeptSize() { return department.getSize(); }
    Budget getDeptBudget() { return department.getBudget(); }
    // ... 10 more delegation methods
}

// AFTER: expose the delegate directly
class Person {
    private Department department;
    Department getDepartment() { return department; }
}
// Client navigates directly when needed:
Manager mgr = person.getDepartment().getManager();
```

## Related Smells

Middle Man

## Inverse

Hide Delegate (technique #12)\n