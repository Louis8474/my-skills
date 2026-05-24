# Rename Field

**Category:** Organizing Data  
**Sources:** Fowler Ch.9

## Problem

A field's name doesn't clearly communicate its purpose. Readers must study the usage to understand what it holds.

## Motivation

Good names are the single most important factor in code readability. Rename a field whenever you find a name that doesn't immediately convey its meaning. This is especially important for public-facing fields (in APIs or serialized data).

## Java 8 / Java 11 Example

```java
// BEFORE: unclear names
class Customer {
    private String n;      // What is n?
    private int cnt;       // Count of what?
    private double val;    // Value of what?
}

// AFTER: names that communicate intent
class Customer {
    private String fullName;
    private int orderCount;
    private double lifetimeSpend;
}
```

## Mechanics for Safe Rename

1. If the field is public, first encapsulate it (add getter/setter)
2. Rename the internal field
3. Update getter/setter names to match
4. Update all references — IDE "Rename" refactoring does this safely
5. If the field is serialized (JSON, database), handle migration carefully

## Related Smells

Mysterious Name\n