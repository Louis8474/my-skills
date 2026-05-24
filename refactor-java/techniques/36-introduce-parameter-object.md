# Introduce Parameter Object

**Category:** Simplifying Method Calls  
**Sources:** Fowler Ch.6, Shvets Ch.10

## Problem

Several parameters always travel together across multiple method signatures. They form a conceptual group but are passed as separate values.

## Motivation

A cluster of parameters that always appear together is a Data Clump. Grouping them into an object reduces parameter lists, gives the group a name, and provides a natural home for behavior related to those parameters. This often leads to discovering richer domain concepts.

## Java 8 Example

```java
// BEFORE: date range parameters repeated everywhere
List<Transaction> getTransactions(Date start, Date end) { ... }
double getTotalRevenue(Date start, Date end) { ... }
List<Order> getOrders(Date start, Date end) { ... }

// AFTER: parameter object with behavior
class DateRange {
    private final LocalDate start;
    private final LocalDate end;

    DateRange(LocalDate start, LocalDate end) {
        if (end.isBefore(start)) throw new IllegalArgumentException("Invalid range");
        this.start = start;
        this.end = end;
    }

    boolean contains(LocalDate date) {
        return !date.isBefore(start) && !date.isAfter(end);
    }

    long getDays() { return ChronoUnit.DAYS.between(start, end); }

    LocalDate getStart() { return start; }
    LocalDate getEnd() { return end; }
}

// Clean signatures
List<Transaction> getTransactions(DateRange range) { ... }
double getTotalRevenue(DateRange range) { ... }
List<Order> getOrders(DateRange range) { ... }
```

## Java 11 Example

```java
// BEFORE: search criteria as scattered params
List<Product> search(String category, double minPrice, double maxPrice,
                     boolean inStock, String sortBy, int page) { ... }

// AFTER: SearchCriteria captures the concept
class SearchCriteria {
    private final String category;
    private final double minPrice;
    private final double maxPrice;
    private final boolean inStockOnly;
    private final String sortBy;
    private final int page;

    // Builder pattern for optional parameters
    static class Builder {
        private String category;
        private double minPrice = 0;
        private double maxPrice = Double.MAX_VALUE;
        private boolean inStockOnly = false;
        private String sortBy = "relevance";
        private int page = 1;

        Builder category(String cat) { this.category = cat; return this; }
        Builder priceRange(double min, double max) { this.minPrice = min; this.maxPrice = max; return this; }
        Builder inStockOnly() { this.inStockOnly = true; return this; }
        Builder sortBy(String sort) { this.sortBy = sort; return this; }
        Builder page(int p) { this.page = p; return this; }
        SearchCriteria build() { return new SearchCriteria(this); }
    }
}

// Clean call site
var results = search(new SearchCriteria.Builder()
    .category("electronics")
    .priceRange(100, 500)
    .inStockOnly()
    .build());
```

## Related Smells

Long Parameter List, Data Clumps, Primitive Obsession
