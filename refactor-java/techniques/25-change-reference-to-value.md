# Change Reference to Value

**Category:** Organizing Data  
**Sources:** Fowler Ch.9, Shvets Ch.8

## Problem

You have a reference object (mutable, identity-based) that would be simpler and safer as a Value Object (immutable, content-based).

## Motivation

Value Objects are simpler to work with: they are immutable, have no identity issues, are safe to share, and don't need synchronization. If an object is small, created frequently, and doesn't need a unique identity, make it a value. Implement `equals()` and `hashCode()` based on content.

## Java 8 Example

```java
// BEFORE: mutable reference with identity
class DateRange {
    private LocalDate start;
    private LocalDate end;
    void setStart(LocalDate start) { this.start = start; }
    void setEnd(LocalDate end) { this.end = end; }
}

// AFTER: immutable Value Object
final class DateRange {
    private final LocalDate start;
    private final LocalDate end;

    DateRange(LocalDate start, LocalDate end) {
        if (end.isBefore(start)) throw new IllegalArgumentException("end before start");
        this.start = start;
        this.end = end;
    }

    LocalDate getStart() { return start; }
    LocalDate getEnd() { return end; }
    boolean contains(LocalDate date) {
        return !date.isBefore(start) && !date.isAfter(end);
    }

    // Instead of mutation, create new instances
    DateRange withStart(LocalDate newStart) { return new DateRange(newStart, end); }
    DateRange withEnd(LocalDate newEnd) { return new DateRange(start, newEnd); }

    @Override public boolean equals(Object o) {
        return o instanceof DateRange
            && start.equals(((DateRange) o).start)
            && end.equals(((DateRange) o).end);
    }
    @Override public int hashCode() { return Objects.hash(start, end); }
}
```

## Related Smells

Mutable Data, Primitive Obsession

## Inverse

Change Value to Reference (technique #26)\n