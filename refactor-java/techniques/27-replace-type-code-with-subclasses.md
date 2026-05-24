# Replace Type Code with Subclasses

**Category:** Organizing Data  
**Sources:** Fowler Ch.12, Shvets Ch.8

## Problem

A class uses a type code (String or int constant like "ENGINEER", "MANAGER") to control conditional behavior via switch/if statements.

## Motivation

When behavior differs by type, switch statements are a maintenance burden — every new type requires updating every switch. Subclasses let each type encapsulate its own behavior. Adding a new type means adding a new class, not modifying existing code (Open/Closed Principle).

## Java 8 Example

```java
// BEFORE: type code with switch
class Employee {
    static final int ENGINEER = 0, MANAGER = 1, SALESPERSON = 2;
    private int type;

    double getBonus() {
        switch (type) {
            case ENGINEER: return salary * 0.05;
            case MANAGER: return salary * 0.10;
            case SALESPERSON: return salary * 0.15 + commission;
            default: throw new IllegalStateException();
        }
    }
}

// AFTER: polymorphic subclasses
abstract class Employee {
    protected double salary;
    abstract double getBonus();

    static Employee create(String type, double salary) {
        switch (type) {
            case "engineer": return new Engineer(salary);
            case "manager": return new Manager(salary);
            case "salesperson": return new Salesperson(salary, 0);
            default: throw new IllegalArgumentException(type);
        }
    }
}

class Engineer extends Employee {
    Engineer(double salary) { this.salary = salary; }
    @Override double getBonus() { return salary * 0.05; }
}

class Manager extends Employee {
    Manager(double salary) { this.salary = salary; }
    @Override double getBonus() { return salary * 0.10; }
}

class Salesperson extends Employee {
    private double commission;
    Salesperson(double salary, double commission) {
        this.salary = salary;
        this.commission = commission;
    }
    @Override double getBonus() { return salary * 0.15 + commission; }
}
```

## Java 11 Example — Using Sealed Classes (preview in Java 15+, but the pattern works in 11)

```java
// Java 11 approach: same pattern with factory method using var
abstract class Shape {
    abstract double area();

    static Shape circle(double radius) { return new Circle(radius); }
    static Shape rectangle(double w, double h) { return new Rectangle(w, h); }
}

class Circle extends Shape {
    private final double radius;
    Circle(double radius) { this.radius = radius; }
    @Override double area() { return Math.PI * radius * radius; }
}

class Rectangle extends Shape {
    private final double width, height;
    Rectangle(double width, double height) { this.width = width; this.height = height; }
    @Override double area() { return width * height; }
}
```

## Related Smells

Repeated Switches, Primitive Obsession

## Variants

- **Replace Type Code with Class**: when the type doesn't affect behavior (just classification)
- **Replace Type Code with State/Strategy**: when the type can change at runtime\n