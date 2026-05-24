# Encapsulate Record

**Category:** Organizing Data  
**Sources:** Fowler Ch.7, Ch.9

## Problem

You're passing around raw data structures (Maps, arrays, JSON-like structures) with no behavior attached. Access to internal structure is uncontrolled.

## Motivation

Records (maps, POJOs with only data) have no behavior. Converting them to objects with methods lets you add validation, derived data, and controlled access. Clients interact with a well-defined interface rather than raw structure.

## Java 8 Example

```java
// BEFORE: raw map as data structure
Map<String, Object> customer = new HashMap<>();
customer.put("name", "John");
customer.put("email", "john@example.com");
// No validation, no behavior, no type safety

// AFTER: proper class with behavior
class Customer {
    private String name;
    private String email;

    Customer(String name, String email) {
        this.name = Objects.requireNonNull(name);
        this.email = validateEmail(email);
    }

    String getName() { return name; }
    String getEmail() { return email; }

    // Behavior belongs with the data
    String getDisplayName() {
        return name + " <" + email + ">";
    }

    private static String validateEmail(String email) {
        if (!email.contains("@")) throw new IllegalArgumentException("Invalid email");
        return email;
    }
}
```

## Java 11 Example

Java 16 introduced `record` types, but in Java 11 you can use immutable classes:

```java
// BEFORE: data as Map
var org = Map.of("name", "Acme", "country", "US", "employees", 500);

// AFTER: typed, immutable class (Java 11 style)
final class Organization {
    private final String name;
    private final String country;
    private final int employeeCount;

    Organization(String name, String country, int employeeCount) {
        this.name = name.strip(); // Java 11 strip()
        this.country = country;
        this.employeeCount = employeeCount;
    }

    String getName() { return name; }
    String getCountry() { return country; }
    int getEmployeeCount() { return employeeCount; }
    boolean isSmallCompany() { return employeeCount < 50; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Organization)) return false;
        var that = (Organization) o;
        return name.equals(that.name) && country.equals(that.country);
    }

    @Override
    public int hashCode() { return Objects.hash(name, country); }
}
```

## Related Smells

Primitive Obsession, Data Class\n