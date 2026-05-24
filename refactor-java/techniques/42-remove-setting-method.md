# Remove Setting Method

**Category:** Simplifying Method Calls  
**Sources:** Fowler Ch.11

## Problem

A field has a setter, but it should only be set during construction. The setter invites mutation after initialization.

## Motivation

If a field should be immutable after object creation, remove the setter and set it only through the constructor. This makes the immutability explicit and prevents accidental mutation.

## Java 8 / Java 11 Example

```java
// BEFORE: setter allows mutation after creation
class Employee {
    private String id;
    private String name;

    void setId(String id) { this.id = id; }    // Should never change!
    void setName(String name) { this.name = name; }
}

// AFTER: id is immutable, set only via constructor
class Employee {
    private final String id;  // final — cannot be changed
    private String name;      // name can still be updated

    Employee(String id, String name) {
        this.id = Objects.requireNonNull(id);
        this.name = name;
    }

    String getId() { return id; }
    // No setter for id
    String getName() { return name; }
    void setName(String name) { this.name = name; } // name is mutable
}
```

## Related Smells

Mutable Data
