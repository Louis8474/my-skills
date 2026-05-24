# Replace Loop with Pipeline

**Category:** Moving Features  
**Sources:** Fowler Ch.8

## Problem

You have an imperative for-loop that filters, transforms, and collects data. The intent is obscured by loop mechanics.

## Motivation

Java 8 Stream API lets you express data transformations declaratively. A pipeline of `filter → map → collect` reads like a description of what you want, not how to do it. This makes the code more readable and less error-prone.

## Java 8 Example

```java
// BEFORE: imperative loop
List<String> result = new ArrayList<>();
for (Employee emp : employees) {
    if (emp.getDepartment().equals("Engineering")) {
        if (emp.getSalary() > 80000) {
            result.add(emp.getName().toUpperCase());
        }
    }
}
Collections.sort(result);

// AFTER: declarative pipeline
List<String> result = employees.stream()
        .filter(emp -> "Engineering".equals(emp.getDepartment()))
        .filter(emp -> emp.getSalary() > 80000)
        .map(emp -> emp.getName().toUpperCase())
        .sorted()
        .collect(Collectors.toList());
```

## Java 11 Example

```java
// BEFORE: complex loop with multiple operations
Map<String, List<Order>> ordersByRegion = new HashMap<>();
for (var order : orders) {
    if (order.getStatus() != OrderStatus.CANCELLED) {
        var region = order.getCustomer().getRegion();
        ordersByRegion.computeIfAbsent(region, k -> new ArrayList<>()).add(order);
    }
}

// AFTER: pipeline with Collectors.groupingBy
var ordersByRegion = orders.stream()
        .filter(order -> order.getStatus() != OrderStatus.CANCELLED)
        .collect(Collectors.groupingBy(
            order -> order.getCustomer().getRegion()
        ));

// Java 11 additions like Predicate.not() can help:
var activeUsers = users.stream()
        .filter(Predicate.not(User::isDeactivated))
        .collect(Collectors.toList());
```

## Related Smells

Loops (code smell from Fowler), Long Method\n