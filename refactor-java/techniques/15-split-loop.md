# Split Loop

**Category:** Moving Features  
**Sources:** Fowler Ch.8

## Problem

A single loop does two or more distinct things. This makes each responsibility harder to understand and modify independently.

## Motivation

A loop that calculates both a total and finds a maximum is doing two things. Splitting into separate loops gives each loop a single responsibility, making them easier to understand, extract into methods, and potentially parallelize. The performance cost is usually negligible.

## Java 8 Example

```java
// BEFORE: one loop does two things
double totalSalary = 0;
int youngestAge = Integer.MAX_VALUE;
for (Employee emp : employees) {
    totalSalary += emp.getSalary();
    youngestAge = Math.min(youngestAge, emp.getAge());
}

// AFTER: two loops, each with single responsibility
double totalSalary = employees.stream()
        .mapToDouble(Employee::getSalary)
        .sum();

int youngestAge = employees.stream()
        .mapToInt(Employee::getAge)
        .min()
        .orElse(0);
```

## Java 11 Example

```java
// BEFORE: loop collects stats AND filters
var activeNames = new ArrayList<String>();
var totalAge = 0;
var count = 0;
for (var user : users) {
    if (user.isActive()) {
        activeNames.add(user.getName());
    }
    totalAge += user.getAge();
    count++;
}
var averageAge = (double) totalAge / count;

// AFTER: each concern handled independently
var activeNames = users.stream()
        .filter(User::isActive)
        .map(User::getName)
        .collect(Collectors.toList());

var averageAge = users.stream()
        .mapToInt(User::getAge)
        .average()
        .orElse(0);
```

## Related Smells

Long Method, Divergent Change\n