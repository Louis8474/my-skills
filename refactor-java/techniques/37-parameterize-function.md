# Parameterize Function

**Category:** Simplifying Method Calls  
**Sources:** Fowler Ch.11, Shvets Ch.10

## Problem

Two or more methods do almost the same thing but differ only by a literal value (a threshold, a multiplier, a type constant).

## Motivation

If the only difference between methods is a value used in the body, merge them into a single parameterized method. This eliminates duplication and makes the pattern explicit.

## Java 8 Example

```java
// BEFORE: three nearly identical methods
void tenPercentRaise(Employee emp) {
    emp.setSalary(emp.getSalary() * 1.10);
}
void fivePercentRaise(Employee emp) {
    emp.setSalary(emp.getSalary() * 1.05);
}
void threePercentRaise(Employee emp) {
    emp.setSalary(emp.getSalary() * 1.03);
}

// AFTER: one parameterized method
void raise(Employee emp, double percentage) {
    emp.setSalary(emp.getSalary() * (1 + percentage / 100));
}
```

## Java 11 Example

```java
// BEFORE: duplicate fetch methods
List<User> fetchActiveUsers() {
    return userRepo.findAll().stream()
            .filter(u -> "ACTIVE".equals(u.getStatus()))
            .collect(Collectors.toList());
}

List<User> fetchSuspendedUsers() {
    return userRepo.findAll().stream()
            .filter(u -> "SUSPENDED".equals(u.getStatus()))
            .collect(Collectors.toList());
}

// AFTER: single parameterized method
List<User> fetchUsersByStatus(String status) {
    return userRepo.findAll().stream()
            .filter(u -> status.equals(u.getStatus()))
            .collect(Collectors.toList());
}
```

## Related Smells

Duplicated Code

## Inverse

Replace Parameter with Explicit Methods (technique #38)
