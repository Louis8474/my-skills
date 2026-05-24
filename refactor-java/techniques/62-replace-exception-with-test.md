# Replace Exception with Test (Replace Exception with Precheck)

**Category:** Additional Techniques  
**Sources:** Shvets Ch.10

## Problem

You're using exceptions for control flow — catching an exception that you could have prevented with a simple check.

## Motivation

Exceptions should be for exceptional, unexpected situations. If you can check a condition before performing an operation, do so. This is faster, clearer, and follows Java best practices. Don't use try-catch as an if-else substitute.

## Java 8 Example

```java
// BEFORE: exception as control flow (bad practice)
double getValueForPeriod(int periodNumber) {
    try {
        return values[periodNumber];
    } catch (ArrayIndexOutOfBoundsException e) {
        return 0;
    }
}

// AFTER: pre-check instead of exception
double getValueForPeriod(int periodNumber) {
    if (periodNumber >= 0 && periodNumber < values.length) {
        return values[periodNumber];
    }
    return 0;
}
```

## Java 11 Example

```java
// BEFORE: exception for Optional-like logic
UserProfile getProfile(String userId) {
    try {
        return userRepo.findById(userId);  // throws if not found
    } catch (NotFoundException e) {
        return UserProfile.defaultProfile();
    }
}

// AFTER: check first, or use Optional
UserProfile getProfile(String userId) {
    return userRepo.findById(userId)    // returns Optional<UserProfile>
            .orElse(UserProfile.defaultProfile());
}
```

## The Rule

**Use exceptions for:** truly exceptional situations (disk full, network down, programming errors). **Use pre-checks for:** conditions that are a normal part of the control flow (user not found, end of list, empty input).

## Related Smells

Long Method (try-catch blocks adding complexity)
