# Introduce Foreign Method

**Category:** Additional Techniques  
**Sources:** Shvets Ch.7

## Problem

You need a method on a class you can't modify (a library class, a third-party API).

## Motivation

When you can't add a method to a class you don't own, create a utility method in your own code that takes the target class as its first parameter. This is a "foreign method" — it belongs conceptually on the target class but lives elsewhere out of necessity.

## Java 8 / Java 11 Example

```java
// You need a nextDay() on java.util.Date (which you can't modify)
// BEFORE: repeated date manipulation across the codebase
Date nextDay = new Date(date.getYear(), date.getMonth(), date.getDate() + 1);

// AFTER: foreign method in a utility class
class DateUtils {
    // Foreign method — conceptually belongs on Date, but we can't modify it
    static LocalDate nextDay(LocalDate date) {
        return date.plusDays(1);
    }

    static boolean isWeekend(LocalDate date) {
        var day = date.getDayOfWeek();
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }
}
```

## When to Upgrade

If you accumulate many foreign methods for the same class, consider Introduce Local Extension (technique #60) to create a proper wrapper or subclass.

## Related Smells

Duplicated Code (same workaround in multiple places)
