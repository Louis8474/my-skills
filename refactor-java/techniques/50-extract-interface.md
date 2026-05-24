# Extract Interface

**Category:** Dealing with Inheritance  
**Sources:** Shvets Ch.11

## Problem

Multiple clients use the same subset of a class's methods, or multiple classes share a common set of method signatures without a common type.

## Motivation

An interface defines a contract without implementation. Extract Interface when you want to declare that a subset of methods is the important API, enabling polymorphism without requiring inheritance. In Java, interfaces also enable multiple inheritance of type.

## Java 8 Example

```java
// BEFORE: two classes with same methods but no common type
class Employee {
    String getName() { ... }
    double getRate() { ... }
    boolean hasSpecialSkill() { ... }
}

class Contractor {
    String getName() { ... }
    double getRate() { ... }
    boolean hasSpecialSkill() { ... }
}

// AFTER: common interface enables polymorphism
interface Billable {
    String getName();
    double getRate();
    boolean hasSpecialSkill();
}

class Employee implements Billable { /* ... */ }
class Contractor implements Billable { /* ... */ }

// Now you can write code that works with any Billable
double totalCost(List<Billable> workers) {
    return workers.stream()
            .mapToDouble(Billable::getRate)
            .sum();
}
```

## Java 11 Example — Interface with default methods

```java
// Java 8+ interfaces can have default methods for shared behavior
interface Exportable {
    Map<String, Object> toMap();

    default String toJson() {
        // Default implementation available to all implementors
        return new Gson().toJson(toMap());
    }

    default String toCsv(String delimiter) {
        return toMap().values().stream()
                .map(Object::toString)
                .collect(Collectors.joining(delimiter));
    }
}
```

## Related Smells

Alternative Classes with Different Interfaces, Parallel Inheritance Hierarchies
