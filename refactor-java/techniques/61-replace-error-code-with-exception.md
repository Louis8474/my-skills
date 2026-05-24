# Replace Error Code with Exception

**Category:** Additional Techniques  
**Sources:** Shvets Ch.10

## Problem

A method returns a special value (like -1, null, or an error code) to indicate failure. Callers must remember to check the return value, and if they forget, bugs happen silently.

## Motivation

Exceptions make error handling explicit and impossible to ignore. They separate the happy path from error handling, improving readability. This is the standard modern Java approach — use exceptions for errors, not magic return values.

## Java 8 Example

```java
// BEFORE: error code (-1 means "not found")
int withdraw(double amount) {
    if (amount > balance) return -1; // Error code
    balance -= amount;
    return 0; // Success code
}
// Caller must remember to check:
if (account.withdraw(500) == -1) { /* handle error... or forget and have a bug */ }

// AFTER: exception makes the error impossible to ignore
void withdraw(double amount) {
    if (amount > balance) {
        throw new InsufficientFundsException(
            "Cannot withdraw " + amount + ": balance is " + balance);
    }
    balance -= amount;
}
```

## Java 11 Example

```java
// Using custom exception with context
class InsufficientFundsException extends RuntimeException {
    private final double requested;
    private final double available;

    InsufficientFundsException(double requested, double available) {
        super("Insufficient funds: requested=" + requested + ", available=" + available);
        this.requested = requested;
        this.available = available;
    }

    double getDeficit() { return requested - available; }
}
```

## Related Smells

Primitive Obsession (using primitives as error indicators)
