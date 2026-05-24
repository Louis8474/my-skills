# Encapsulate Variable

**Category:** Organizing Data  
**Sources:** Fowler Ch.7

## Problem

Data is accessed directly, especially data with wide scope (public fields, global state). This makes it difficult to monitor or validate changes.

## Motivation

Data is harder to manipulate than functions. You can rename a function and keep the old one as a forwarding function; with data, you must change all references at once. Encapsulate Variable wraps data access behind getters/setters, converting the hard problem (reorganizing data) into the easier problem (reorganizing functions).

## Java 8 Example

```java
// BEFORE: public mutable field — anyone can change it
class Config {
    public static String defaultOwner = "Martin";
}
// Usage: Config.defaultOwner = "Kent"; // Uncontrolled mutation

// AFTER: encapsulated — access controlled through methods
class Config {
    private static String defaultOwner = "Martin";

    public static String getDefaultOwner() {
        return defaultOwner;
    }

    public static void setDefaultOwner(String owner) {
        Objects.requireNonNull(owner, "Owner cannot be null");
        defaultOwner = owner;
        // Can now add logging, validation, notifications
    }
}
```

## Java 11 Example

```java
// BEFORE: mutable shared state
class ApplicationContext {
    public Map<String, Object> settings = new HashMap<>();
}

// AFTER: encapsulated with defensive copies
class ApplicationContext {
    private final Map<String, Object> settings = new HashMap<>();

    // Return unmodifiable view (Java 11 Map.copyOf for true immutable copy)
    public Map<String, Object> getSettings() {
        return Map.copyOf(settings); // Java 10+
    }

    public void setSetting(String key, Object value) {
        Objects.requireNonNull(key);
        settings.put(key, value);
    }

    public Optional<Object> getSetting(String key) {
        return Optional.ofNullable(settings.get(key));
    }
}
```

## Related Smells

Global Data, Mutable Data\n