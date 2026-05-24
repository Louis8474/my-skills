# Replace Conditional with Polymorphism

**Category:** Simplifying Conditionals  
**Sources:** Fowler Ch.10, Shvets Ch.9

## Problem

You have a conditional (switch or chained if/else) that selects behavior based on the type of an object. The same switch appears in multiple places.

## Motivation

This is one of the most powerful refactorings. Polymorphism lets each type encapsulate its own behavior. Adding a new type means adding a new class — not hunting down every switch statement. This follows the Open/Closed Principle.

## Java 8 Example

```java
// BEFORE: switch on type in multiple places
class Bird {
    private String type;

    double getSpeed() {
        switch (type) {
            case "EUROPEAN": return getBaseSpeed();
            case "AFRICAN": return getBaseSpeed() - getLoadFactor() * numberOfCoconuts;
            case "NORWEGIAN_BLUE": return isNailed ? 0 : getBaseSpeed();
            default: throw new IllegalStateException("Unknown bird: " + type);
        }
    }

    String getPlumage() {
        switch (type) {
            case "EUROPEAN": return "average";
            case "AFRICAN": return numberOfCoconuts > 2 ? "tired" : "average";
            case "NORWEGIAN_BLUE": return voltage > 100 ? "scorched" : "beautiful";
            default: throw new IllegalStateException("Unknown bird: " + type);
        }
    }
}

// AFTER: each type is a class with its own behavior
abstract class Bird {
    abstract double getSpeed();
    abstract String getPlumage();

    static Bird create(String type, Map<String, Object> data) {
        switch (type) {
            case "EUROPEAN": return new EuropeanSwallow();
            case "AFRICAN": return new AfricanSwallow((int) data.get("coconuts"));
            case "NORWEGIAN_BLUE": return new NorwegianBlue(
                (boolean) data.get("nailed"), (double) data.get("voltage"));
            default: throw new IllegalArgumentException(type);
        }
    }
}

class EuropeanSwallow extends Bird {
    @Override double getSpeed() { return 35; }
    @Override String getPlumage() { return "average"; }
}

class AfricanSwallow extends Bird {
    private final int numberOfCoconuts;
    AfricanSwallow(int coconuts) { this.numberOfCoconuts = coconuts; }
    @Override double getSpeed() { return 40 - 2 * numberOfCoconuts; }
    @Override String getPlumage() { return numberOfCoconuts > 2 ? "tired" : "average"; }
}

class NorwegianBlue extends Bird {
    private final boolean isNailed;
    private final double voltage;
    NorwegianBlue(boolean nailed, double voltage) { this.isNailed = nailed; this.voltage = voltage; }
    @Override double getSpeed() { return isNailed ? 0 : 10 + voltage / 10; }
    @Override String getPlumage() { return voltage > 100 ? "scorched" : "beautiful"; }
}
```

## Java 11 Example

```java
// Java 11 with factory using var and Optional
abstract class NotificationSender {
    abstract void send(String message, String recipient);

    static NotificationSender forChannel(String channel) {
        // Factory — the only switch left
        switch (channel) {
            case "email": return new EmailSender();
            case "sms": return new SmsSender();
            case "push": return new PushNotificationSender();
            default: throw new IllegalArgumentException("Unknown channel: " + channel);
        }
    }
}

class EmailSender extends NotificationSender {
    @Override void send(String message, String recipient) {
        var sanitized = message.strip(); // Java 11
        // Email-specific logic
    }
}
// ... each channel has its own class
```

## Related Smells

Repeated Switches, Long Method
