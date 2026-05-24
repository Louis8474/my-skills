# Move Statements (Into Function / To Callers / Slide)

**Category:** Moving Features  
**Sources:** Fowler Ch.8

## Problem

Code that always accompanies a function call should be inside that function, code that varies between callers should be outside, and related statements should be adjacent.

## Motivation

This is actually three related techniques. **Move Statements into Function** consolidates repeated code into the function. **Move Statements to Callers** extracts varying code out of a function. **Slide Statements** rearranges code to group related things together, preparing for Extract Method.

## Java 8 Example — Slide Statements

```java
// BEFORE: declaration separated from usage
double total = 0;
String reportTitle = "Monthly Report"; // unrelated
List<Order> orders = getOrders();      // unrelated

for (Order order : orders) {
    total += order.getAmount();
}

// AFTER: slide declaration next to usage
String reportTitle = "Monthly Report";
List<Order> orders = getOrders();

double total = 0;  // Now adjacent to the loop that uses it
for (Order order : orders) {
    total += order.getAmount();
}
```

## Java 11 Example — Move Statements into Function

```java
// BEFORE: duplicate code around every call to formatName
// Caller 1:
var name = employee.getName().strip();  // Java 11 strip()
var formatted = formatName(name);
log.info("Formatted: " + formatted);

// Caller 2:
var name2 = contractor.getName().strip();
var formatted2 = formatName(name2);
log.info("Formatted: " + formatted2);

// AFTER: move common pre/post steps into the function
String formatAndLogName(String rawName) {
    var name = rawName.strip();
    var formatted = formatName(name);
    log.info("Formatted: " + formatted);
    return formatted;
}
```

## Related Smells

Duplicated Code, Long Method\n