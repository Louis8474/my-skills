# Replace Primitive with Object

**Category:** Organizing Data  
**Sources:** Fowler Ch.7, Shvets Ch.8
**Also known as:** Replace Data Value with Object

## Problem

You're using primitive types (String, int, double) for domain concepts that have rules, behavior, or formatting. Phone numbers are Strings, money is a double, email is a String.

## Motivation

When a primitive starts growing behavior — validation, formatting, comparison, conversion — it deserves its own class. This is one of the most valuable refactorings because it transforms scattered, duplicated logic into a single, testable domain type.

## Java 8 Example

```java
// BEFORE: priority as String with scattered comparisons
class Order {
    private String priority; // "low", "normal", "high", "rush"

    boolean isHighPriority() {
        return "high".equals(priority) || "rush".equals(priority);
    }
}

// AFTER: Priority as a Value Object with behavior
class Priority {
    private final String value;
    private static final List<String> LEGAL_VALUES =
            Arrays.asList("low", "normal", "high", "rush");

    Priority(String value) {
        if (!LEGAL_VALUES.contains(value))
            throw new IllegalArgumentException("Invalid priority: " + value);
        this.value = value;
    }

    boolean higherThan(Priority other) {
        return index() > other.index();
    }

    boolean lowerThan(Priority other) {
        return index() < other.index();
    }

    private int index() {
        return LEGAL_VALUES.indexOf(value);
    }

    @Override
    public String toString() { return value; }

    @Override
    public boolean equals(Object o) {
        return o instanceof Priority && value.equals(((Priority) o).value);
    }

    @Override
    public int hashCode() { return value.hashCode(); }
}

class Order {
    private Priority priority;

    boolean isHighPriority() {
        return priority.higherThan(new Priority("normal"));
    }
}
```

## Java 11 Example

```java
// BEFORE: money as double (rounding errors, no currency)
class Invoice {
    private double amount; // What currency? How to format?
}

// AFTER: Money as a proper Value Object
final class Money {
    private final BigDecimal amount;
    private final Currency currency;

    private Money(BigDecimal amount, Currency currency) {
        this.amount = amount.setScale(2, RoundingMode.HALF_UP);
        this.currency = currency;
    }

    static Money of(double amount, String currencyCode) {
        return new Money(BigDecimal.valueOf(amount), Currency.getInstance(currencyCode));
    }

    static Money zero(String currencyCode) {
        return of(0, currencyCode);
    }

    Money add(Money other) {
        assertSameCurrency(other);
        return new Money(amount.add(other.amount), currency);
    }

    Money multiply(int quantity) {
        return new Money(amount.multiply(BigDecimal.valueOf(quantity)), currency);
    }

    boolean isGreaterThan(Money other) {
        assertSameCurrency(other);
        return amount.compareTo(other.amount) > 0;
    }

    // Java 11 strip() for formatted output
    String format() {
        return currency.getSymbol() + " " + amount.toPlainString().strip();
    }

    private void assertSameCurrency(Money other) {
        if (!currency.equals(other.currency))
            throw new IllegalArgumentException("Currency mismatch");
    }

    @Override public boolean equals(Object o) {
        return o instanceof Money && amount.equals(((Money) o).amount)
                && currency.equals(((Money) o).currency);
    }
    @Override public int hashCode() { return Objects.hash(amount, currency); }
    @Override public String toString() { return format(); }
}
```

## Related Smells

Primitive Obsession, Data Clumps\n