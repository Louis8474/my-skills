# Change Value to Reference

**Category:** Organizing Data  
**Sources:** Fowler Ch.9, Shvets Ch.8

## Problem

You have multiple copies of an object with the same data, and updates to one copy aren't reflected in others. You need a single shared instance.

## Motivation

When multiple objects represent the same entity (e.g., the same Customer appearing in many Orders), changes should be visible everywhere. Use a repository/registry to ensure a single shared reference.

## Java 8 Example

```java
// BEFORE: each Order creates its own Customer copy
class Order {
    private Customer customer;
    Order(String customerId) {
        this.customer = new Customer(customerId); // New instance each time!
    }
}

// AFTER: shared reference via repository
class CustomerRepository {
    private static final Map<String, Customer> instances = new HashMap<>();

    static Customer get(String id) {
        return instances.computeIfAbsent(id, Customer::new);
    }
}

class Order {
    private Customer customer;
    Order(String customerId) {
        this.customer = CustomerRepository.get(customerId); // Shared instance
    }
}
```

## Related Smells

Duplicated Code (duplicated entity state)

## Inverse

Change Reference to Value (technique #25)\n