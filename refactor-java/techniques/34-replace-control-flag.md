# Replace Control Flag with Break/Return

**Category:** Simplifying Conditionals  
**Sources:** Shvets Ch.9

## Problem

A boolean variable is used to control the flow of a loop or method (like `boolean found = false`). The control flag obscures the actual logic.

## Motivation

Control flags make loops harder to read because you must mentally track the flag's state. Use `break`, `return`, or `continue` instead to express the flow directly. In Java 8+, Stream operations often eliminate the need for control flags entirely.

## Java 8 Example

```java
// BEFORE: control flag obscures intent
boolean found = false;
String foundPerson = "";
for (String person : people) {
    if (!found) {
        if (person.equals("Don")) {
            found = true;
            foundPerson = "Don";
        }
        if (person.equals("John")) {
            found = true;
            foundPerson = "John";
        }
    }
}

// AFTER: using return (if extracted to method) or Stream
String findPerson(List<String> people) {
    Set<String> candidates = new HashSet<>(Arrays.asList("Don", "John", "Kent"));
    return people.stream()
            .filter(candidates::contains)
            .findFirst()
            .orElse("");
}
```

## Java 11 Example

```java
// BEFORE: flag controlling a complex loop
boolean hasViolation = false;
String violationMessage = "";
for (var rule : businessRules) {
    if (!hasViolation) {
        var result = rule.validate(order);
        if (!result.isValid()) {
            hasViolation = true;
            violationMessage = result.getMessage();
        }
    }
}

// AFTER: return directly from method
Optional<String> findFirstViolation(Order order, List<BusinessRule> rules) {
    return rules.stream()
            .map(rule -> rule.validate(order))
            .filter(result -> !result.isValid())
            .map(ValidationResult::getMessage)
            .findFirst();
}
```

## Related Smells

Long Method, Mysterious Name (cryptic flag variables)
