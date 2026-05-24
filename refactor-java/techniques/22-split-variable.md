# Split Variable

**Category:** Organizing Data  
**Sources:** Fowler Ch.9

## Problem

A variable is assigned more than once for different purposes. It's being reused as a scratch pad.

## Motivation

A variable should represent one concept. When a variable is reassigned for a different purpose (not just updated like an accumulator), it confuses readers about what it means at any point. Split it into separate variables, each with a descriptive name.

## Java 8 Example

```java
// BEFORE: 'temp' reused for two different things
double temp = 2 * (height + width);
System.out.println("Perimeter: " + temp);
temp = height * width;
System.out.println("Area: " + temp);

// AFTER: each concept has its own named variable
double perimeter = 2 * (height + width);
System.out.println("Perimeter: " + perimeter);
double area = height * width;
System.out.println("Area: " + area);
```

## Java 11 Example

```java
// BEFORE: 'result' reused across unrelated computations
var result = employees.stream().mapToDouble(Employee::getSalary).sum();
System.out.println("Total salary: " + result);

result = employees.stream().mapToDouble(Employee::getSalary).average().orElse(0);
System.out.println("Average salary: " + result);

// AFTER: separate variables with clear names
var totalSalary = employees.stream().mapToDouble(Employee::getSalary).sum();
System.out.println("Total salary: " + totalSalary);

var averageSalary = employees.stream().mapToDouble(Employee::getSalary).average().orElse(0);
System.out.println("Average salary: " + averageSalary);
```

## Related Smells

Long Method, Mysterious Name\n