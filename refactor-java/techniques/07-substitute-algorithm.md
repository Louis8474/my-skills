# Substitute Algorithm

**Category:** Composing Methods
**Sources:** Fowler Ch.7, Shvets Ch.6

## Problem

You want to replace an algorithm with one that is clearer or more efficient. The old way works but is harder to understand or maintain.

## Motivation

Sometimes you find a simpler way to do the same thing. Before you can substitute, make sure the method is as decomposed as possible — it's easier to replace a clear, small method. Then swap the algorithm and run all tests to verify behavior is preserved.

## Java 8 Example

```java
// BEFORE: manual loop with multiple comparisons
String foundPerson(List<String> people) {
    for (int i = 0; i < people.size(); i++) {
        if (people.get(i).equals("Don")) return "Don";
        if (people.get(i).equals("John")) return "John";
        if (people.get(i).equals("Kent")) return "Kent";
    }
    return "";
}

// AFTER: clearer algorithm using Java 8 Streams
String foundPerson(List<String> people) {
    List<String> candidates = Arrays.asList("Don", "John", "Kent");
    return people.stream()
            .filter(candidates::contains)
            .findFirst()
            .orElse("");
}
```

## Java 11 Example

```java
// BEFORE: complex date parsing with manual handling
LocalDate parseFlexibleDate(String input) {
    try {
        return LocalDate.parse(input, DateTimeFormatter.ISO_DATE);
    } catch (Exception e1) {
        try {
            return LocalDate.parse(input, DateTimeFormatter.ofPattern("MM/dd/yyyy"));
        } catch (Exception e2) {
            try {
                return LocalDate.parse(input, DateTimeFormatter.ofPattern("dd-MMM-yyyy"));
            } catch (Exception e3) {
                return null;
            }
        }
    }
}

// AFTER: data-driven algorithm (Java 11 List.of)
private static final List<DateTimeFormatter> SUPPORTED_FORMATS = List.of(
    DateTimeFormatter.ISO_DATE,
    DateTimeFormatter.ofPattern("MM/dd/yyyy"),
    DateTimeFormatter.ofPattern("dd-MMM-yyyy")
);

Optional<LocalDate> parseFlexibleDate(String input) {
    return SUPPORTED_FORMATS.stream()
            .map(fmt -> tryParse(input, fmt))
            .flatMap(Optional::stream)  // Java 9+ method
            .findFirst();
}

private Optional<LocalDate> tryParse(String input, DateTimeFormatter fmt) {
    try {
        return Optional.of(LocalDate.parse(input, fmt));
    } catch (DateTimeParseException e) {
        return Optional.empty();
    }
}
```

## Related Smells

Long Method, Comments (explaining a convoluted algorithm)
