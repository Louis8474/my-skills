# Separate Query from Modifier (CQS)

**Category:** Simplifying Method Calls  
**Sources:** Fowler Ch.11, Shvets Ch.10

## Problem

A function both returns a value AND has a side effect (modifies state, sends a message, writes to disk). Callers don't expect the side effect.

## Motivation

Command-Query Separation (CQS) says: a method should either **return a value** (query) or **change state** (command), never both. This makes code predictable — you can call queries without worrying about unintended consequences. It's the most important API design principle in this catalog.

## Java 8 Example

```java
// BEFORE: query + side effect in one method
String getTotalAndSendBill(Customer customer) {
    String total = calculateTotal(customer);
    emailService.sendBill(customer, total); // Hidden side effect!
    return total;
}

// AFTER: separated — each does one thing
String getTotal(Customer customer) {
    return calculateTotal(customer); // Pure query — no side effects
}

void sendBill(Customer customer) {
    String total = getTotal(customer);
    emailService.sendBill(customer, total); // Explicit command
}
```

## Java 11 Example

```java
// BEFORE: findAndRemove violates CQS
Optional<Alert> findAlertAndMarkSeen(String userId) {
    var alert = alertRepo.findFirstUnseen(userId);
    alert.ifPresent(a -> {
        a.setSeenAt(Instant.now()); // Side effect hidden in a "find" method
        alertRepo.save(a);
    });
    return alert;
}

// AFTER: query and command are separate
Optional<Alert> findFirstUnseenAlert(String userId) {
    return alertRepo.findFirstUnseen(userId); // Pure query
}

void markAlertAsSeen(Alert alert) {
    alert.setSeenAt(Instant.now()); // Explicit command
    alertRepo.save(alert);
}
```

## Related Smells

Feature Envy, Inappropriate Intimacy (method reaching into state it shouldn't touch)
