# Pull Up Constructor Body

**Category:** Dealing with Inheritance  
**Sources:** Fowler Ch.12

## Problem

Subclass constructors have identical initialization code. Each constructor repeats the same setup steps.

## Motivation

Duplicated constructor logic should be consolidated in the superclass constructor via `super()`. Each subclass constructor calls `super(...)` with the common parameters and then initializes only its own specific fields.

## Java 8 / Java 11 Example

```java
// BEFORE: duplicated constructor logic
class Manager extends Employee {
    private int grade;
    Manager(String name, String id, int grade) {
        this.name = name;    // Duplicate
        this.id = id;        // Duplicate
        this.grade = grade;
    }
}

class Engineer extends Employee {
    private String specialty;
    Engineer(String name, String id, String specialty) {
        this.name = name;    // Duplicate
        this.id = id;        // Duplicate
        this.specialty = specialty;
    }
}

// AFTER: common init in superclass
abstract class Employee {
    protected String name;
    protected String id;

    Employee(String name, String id) {
        this.name = Objects.requireNonNull(name);
        this.id = Objects.requireNonNull(id);
    }
}

class Manager extends Employee {
    private final int grade;
    Manager(String name, String id, int grade) {
        super(name, id);  // Common init via super
        this.grade = grade;
    }
}

class Engineer extends Employee {
    private final String specialty;
    Engineer(String name, String id, String specialty) {
        super(name, id);  // Common init via super
        this.specialty = specialty;
    }
}
```

## Related Smells

Duplicated Code
