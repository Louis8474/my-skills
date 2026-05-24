# Move Field

**Category:** Moving Features
**Sources:** Fowler Ch.8, Shvets Ch.7

## Problem

A field is used more by another class than by the class where it's defined.

## Motivation

As you understand a domain better, you realize data belongs elsewhere. Move Field puts data near the code that uses it. This is more difficult than Move Method because field references must be updated simultaneously. Always encapsulate the field first (getter/setter) to make the migration easier.

## Java 8 Example

```java
// BEFORE: discountRate in Customer but only used by AccountType logic
class Customer {
    private String name;
    private double discountRate; // Feature Envy target
    private AccountType accountType;

    double getDiscountRate() { return discountRate; }
}

// AFTER: discountRate moved to AccountType
class AccountType {
    private double discountRate;

    double getDiscountRate() { return discountRate; }
    void setDiscountRate(double rate) { this.discountRate = rate; }
}

class Customer {
    private String name;
    private AccountType accountType;

    // Delegate for backward compatibility during migration
    double getDiscountRate() {
        return accountType.getDiscountRate();
    }
}
```

## Java 11 Example

```java
// BEFORE: timezone stored in User but mainly used by NotificationService
class User {
    private String name;
    private String email;
    private ZoneId timezone;  // Almost never used by User itself
}

// AFTER: timezone in NotificationPreferences — a better home
class NotificationPreferences {
    private final ZoneId timezone;
    private final boolean emailEnabled;
    private final List<String> channels;

    // timezone lives with other notification-related config
    public ZoneId getTimezone() { return timezone; }
}

class User {
    private String name;
    private String email;
    private NotificationPreferences notificationPrefs;

    // If needed for backward compatibility:
    public ZoneId getTimezone() {
        return notificationPrefs.getTimezone();
    }
}
```

## Related Smells

Feature Envy, Data Clumps, Shotgun Surgery
