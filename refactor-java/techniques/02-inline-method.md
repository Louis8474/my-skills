# Inline Method

**Category:** Composing Methods
**Sources:** Fowler Ch.6, Shvets Ch.6
**Also known as:** Inline Function

## Problem

A method's body is as clear (or clearer) than its name, or the method only adds a useless level of indirection. The abstraction doesn't earn its keep.

## Motivation

Sometimes after a series of refactorings, a method becomes so simple that its name doesn't add any more clarity than the body itself. In other cases, you have a group of poorly-factored methods and you want to inline them all back into one big method, then re-extract in a better way. Inline Method is also the inverse of Extract Method — it's the "undo" button.

## Java 8 Example

```java
// BEFORE: method adds no value
int getRating() {
    return moreThanFiveLateDeliveries() ? 2 : 1;
}

boolean moreThanFiveLateDeliveries() {
    return numberOfLateDeliveries > 5;
}

// AFTER: inlined — the expression is self-explanatory
int getRating() {
    return numberOfLateDeliveries > 5 ? 2 : 1;
}
```

## Java 11 Example

```java
// BEFORE: unnecessary delegation after previous refactoring
public List<String> getActiveUserNames(List<User> users) {
    return filterActive(users).stream()
            .map(this::extractName)
            .collect(Collectors.toList());
}

private List<User> filterActive(List<User> users) {
    return users.stream().filter(User::isActive).collect(Collectors.toList());
}

private String extractName(User user) {
    return user.getName();
}

// AFTER: inlined — the pipeline reads clearly without helper methods
public List<String> getActiveUserNames(List<User> users) {
    return users.stream()
            .filter(User::isActive)
            .map(User::getName)
            .collect(Collectors.toList());
}
```

## When NOT to Inline

- If the method is overridden in subclasses (polymorphic)
- If the method is recursive
- If the method is called from many places and inlining would create duplication

## Related Smells

Lazy Element, Speculative Generality

## Inverse

Extract Method (technique #01)
