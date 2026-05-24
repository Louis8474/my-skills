# Change Function Declaration

**Category:** Simplifying Method Calls / API Design  
**Sources:** Fowler Ch.6, Shvets Ch.10
**Also known as:** Rename Method, Change Signature

## Problem

A function's name doesn't clearly express what it does, or its parameters don't match how callers actually use it.

## Motivation

Function names are the most important form of documentation. If a name requires you to read the body to understand the purpose, rename it. Similarly, parameters define the function's relationship to its world — adding, removing, or reordering them can dramatically improve an API.

## Java 8 Example

```java
// BEFORE: vague name, confusing parameter order
void process(String s, int n, boolean b) {
    // What does this even do?
}

// AFTER: name and parameters communicate intent
void sendNotification(String recipientEmail, int retryCount, boolean isUrgent) {
    // Now the call site reads clearly:
    // sendNotification("user@example.com", 3, true);
}
```

## Java 11 Example — Safe Migration with Forwarding

```java
// Step 1: Create new method with better name
// Step 2: Have old method delegate to new one (deprecated)
// Step 3: Migrate callers gradually
// Step 4: Remove old method

class CustomerService {
    // New, clear API
    List<Customer> findByRegion(String region) {
        return customerRepo.findAll().stream()
                .filter(c -> region.equals(c.getRegion()))
                .collect(Collectors.toList());
    }

    // Old API deprecated, delegates to new
    @Deprecated
    List<Customer> getCustomers(String r) {
        return findByRegion(r);
    }
}
```

## Related Smells

Mysterious Name, Long Parameter List
