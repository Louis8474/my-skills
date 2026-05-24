# Replace Query with Parameter

**Category:** Simplifying Method Calls  
**Sources:** Fowler Ch.11

## Problem

A method internally queries global state, a configuration object, or an external service. This hidden dependency makes the method hard to test and reason about.

## Motivation

Making a dependency explicit by passing it as a parameter makes the method purer and easier to test. Instead of the method reaching out to the world, the caller provides the value. This is the inverse of Replace Parameter with Query.

## Java 8 Example

```java
// BEFORE: hidden dependency on global thermostat
double targetTemperature(HeatingPlan plan) {
    double currentTemp = thermostat.getCurrentTemperature(); // Hidden dependency!
    if (currentTemp > plan.getMax()) return plan.getMax();
    if (currentTemp < plan.getMin()) return plan.getMin();
    return currentTemp;
}

// AFTER: dependency is explicit — easier to test
double targetTemperature(HeatingPlan plan, double currentTemperature) {
    if (currentTemperature > plan.getMax()) return plan.getMax();
    if (currentTemperature < plan.getMin()) return plan.getMin();
    return currentTemperature;
}
```

## Java 11 Example

```java
// BEFORE: method queries clock internally
boolean isBusinessHours() {
    var now = LocalTime.now(); // Hidden dependency on system clock
    return now.isAfter(LocalTime.of(9, 0)) && now.isBefore(LocalTime.of(17, 0));
}

// AFTER: time passed as parameter — testable with any time
boolean isBusinessHours(LocalTime currentTime) {
    return currentTime.isAfter(LocalTime.of(9, 0))
        && currentTime.isBefore(LocalTime.of(17, 0));
}
```

## Inverse

Replace Parameter with Query (technique #40)
