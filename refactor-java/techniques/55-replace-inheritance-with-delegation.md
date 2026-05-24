# Replace Inheritance with Delegation (General)

**Category:** Dealing with Inheritance  
**Sources:** Shvets Ch.11

## Problem

A class inherits from another but uses only a small fraction of inherited methods, or the subclass relationship no longer makes sense.

## Motivation

This is the general form of techniques #53 and #54. Whenever you find inheritance that's awkward, wrong, or too restrictive, convert the "is-a" to "has-a" by creating a field for the former superclass and delegating only the methods you need. This gives you the Liskov-correct interface.

## Java 11 Example

```java
// BEFORE: using inheritance just for code reuse (not a true "is-a")
class OrderStatistics extends HashMap<String, Double> {
    void addMetric(String name, double value) { put(name, value); }
    double getMetric(String name) { return getOrDefault(name, 0.0); }
}
// Problem: clients can call clear(), containsKey(), entrySet()... all of HashMap

// AFTER: delegation — clean interface
class OrderStatistics {
    private final Map<String, Double> metrics = new HashMap<>();  // has-a

    void addMetric(String name, double value) { metrics.put(name, value); }
    double getMetric(String name) { return metrics.getOrDefault(name, 0.0); }
    boolean hasMetric(String name) { return metrics.containsKey(name); }

    // Expose only what makes sense for statistics
    Map<String, Double> asUnmodifiableMap() {
        return Map.copyOf(metrics);
    }
}
```

## The Decision Rule

Use **inheritance** when the subclass truly "is-a" specialization and uses most of the superclass interface. Use **delegation** when you only need some behavior from another class, the relationship is "has-a" or "uses-a", or you need runtime flexibility.
