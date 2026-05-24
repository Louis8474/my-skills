# Replace Constructor with Factory Function

**Category:** Simplifying Method Calls  
**Sources:** Fowler Ch.11, Shvets Ch.10

## Problem

A constructor is too limited: it must return exactly the declared type, can't have a descriptive name, and can't be overridden.

## Motivation

Factory methods offer naming flexibility, can return different subtypes, can apply caching, and can perform complex initialization logic. They make the creation intent explicit.

## Java 8 Example

```java
// BEFORE: constructor with type code
Employee emp = new Employee("Alice", "E"); // What is "E"?

// AFTER: factory methods with descriptive names
class Employee {
    private String name;
    private String type;

    private Employee(String name, String type) {
        this.name = name;
        this.type = type;
    }

    static Employee createEngineer(String name) {
        return new Employee(name, "engineer");
    }

    static Employee createManager(String name) {
        return new Employee(name, "manager");
    }

    static Employee createSalesperson(String name) {
        return new Employee(name, "salesperson");
    }
}

// Client code reads like prose:
Employee alice = Employee.createEngineer("Alice");
```

## Java 11 Example

```java
// Factory returning different subtypes
abstract class Document {
    static Document fromFile(Path path) {
        var extension = getExtension(path);
        switch (extension) {
            case "pdf": return new PdfDocument(path);
            case "docx": return new WordDocument(path);
            case "md": return new MarkdownDocument(path);
            default: throw new IllegalArgumentException("Unsupported: " + extension);
        }
    }

    private static String getExtension(Path path) {
        var filename = path.getFileName().toString();
        return filename.substring(filename.lastIndexOf('.') + 1).strip();
    }

    abstract String extractText();
}
```

## Related Smells

Repeated Switches (factory centralizes type creation), Primitive Obsession (type codes)
