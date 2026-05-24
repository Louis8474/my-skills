# Introduce Local Extension

**Category:** Additional Techniques  
**Sources:** Shvets Ch.7

## Problem

You need multiple additional methods on a class you can't modify. Foreign Methods are piling up.

## Motivation

When you need several methods on a third-party class, create a Local Extension — either a subclass or a wrapper that provides all the missing methods in one place. This is cleaner than scattering foreign methods across utility classes.

## Java 8 Example — Wrapper approach

```java
// AFTER: wrapper class for java.util.Date functionality
class EnhancedDate {
    private final LocalDate date;

    EnhancedDate(LocalDate date) {
        this.date = date;
    }

    LocalDate nextDay() { return date.plusDays(1); }
    boolean isWeekend() {
        var day = date.getDayOfWeek();
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }
    boolean isBusinessDay() { return !isWeekend(); }
    LocalDate nextBusinessDay() {
        LocalDate next = nextDay();
        while (new EnhancedDate(next).isWeekend()) {
            next = next.plusDays(1);
        }
        return next;
    }

    // Delegate all original methods you need
    int getYear() { return date.getYear(); }
    Month getMonth() { return date.getMonth(); }
}
```

## Related Smells

Duplicated Code (many foreign methods for the same class)
