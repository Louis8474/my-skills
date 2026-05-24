# Hide Delegate

**Category:** Moving Features  
**Sources:** Fowler Ch.7, Shvets Ch.7

## Problem

A client calls `person.getDepartment().getManager()` — navigating through an object's internal structure. This creates tight coupling to the internal chain.

## Motivation

When a client navigates through a chain of objects, it depends on the entire chain. If the internal structure changes, all clients break. Hide Delegate adds a method on the first object that encapsulates the navigation, so clients depend only on the immediate object.

## Java 8 Example

```java
// BEFORE: client coupled to internal structure
// client code:
Manager manager = employee.getDepartment().getManager();

// AFTER: delegation hidden behind employee's interface
class Employee {
    private Department department;

    // Client no longer needs to know about Department
    Manager getManager() {
        return department.getManager();
    }
}

// client code is now cleaner:
Manager manager = employee.getManager();
```

## Java 11 Example

```java
// BEFORE: chain navigation for notification settings
var emailTemplate = user.getPreferences().getNotificationConfig().getEmailTemplate();

// AFTER: hide the chain
class User {
    private UserPreferences preferences;

    // Each level hides its delegate
    String getEmailTemplate() {
        return preferences.getEmailTemplate();
    }
}

class UserPreferences {
    private NotificationConfig notificationConfig;

    String getEmailTemplate() {
        return notificationConfig.getEmailTemplate();
    }
}
```

## Trade-off

Adding too many delegating methods creates a Middle Man — if half a class's methods just delegate, consider Remove Middle Man instead.

## Related Smells

Message Chains

## Inverse

Remove Middle Man (technique #13)\n