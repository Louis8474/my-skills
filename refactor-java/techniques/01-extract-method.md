# Extract Method

**Category:** Composing Methods
**Sources:** Fowler Ch.6, Shvets Ch.6
**Also known as:** Extract Function

## Problem

You have a code fragment that can be grouped together, or a method is too long and does multiple things. You need to pause and think about what a block of code does before you can move on.

## Motivation

Extract Method is the single most commonly performed refactoring. The core idea is to separate **intention** from **implementation**: if you need effort to understand what a code block does, extract it into a method whose name describes the purpose. After extraction, readers understand the intent without reading the implementation. Short, well-named methods are self-documenting, reusable, and easier to override or test independently.

## When to Apply

- A method is longer than 10-15 lines
- You see a comment explaining what the next block does (the comment becomes the method name)
- A block of code is reused (or could be) in other methods
- A method operates at multiple levels of abstraction

## Mechanics

1. Create a new method with a name that describes **what** the code does (not how)
2. Copy the extracted code into the new method
3. Identify local variables used in the extracted code — they become parameters or stay as local vars in the new method
4. If the extracted code modifies a local variable, consider making it the return value
5. Replace the original code block with a call to the new method
6. Test

## Java 8 Example

```java
// BEFORE: A single method doing printing, calculating, and formatting
public void printInvoice(Invoice invoice) {
    // print banner
    System.out.println("**************************");
    System.out.println("****** Customer Invoice ******");
    System.out.println("**************************");

    // calculate outstanding
    double outstanding = 0;
    for (Order order : invoice.getOrders()) {
        outstanding += order.getAmount();
    }

    // print details
    System.out.println("Name: " + invoice.getCustomerName());
    System.out.println("Amount: " + outstanding);
    System.out.println("Due: " + invoice.getDueDate());
}

// AFTER: Each block becomes a method with a descriptive name
public void printInvoice(Invoice invoice) {
    printBanner();
    double outstanding = calculateOutstanding(invoice);
    printDetails(invoice, outstanding);
}

private void printBanner() {
    System.out.println("**************************");
    System.out.println("****** Customer Invoice ******");
    System.out.println("**************************");
}

// Using Java 8 Stream to calculate the total
private double calculateOutstanding(Invoice invoice) {
    return invoice.getOrders().stream()
            .mapToDouble(Order::getAmount)
            .sum();
}

private void printDetails(Invoice invoice, double outstanding) {
    System.out.println("Name: " + invoice.getCustomerName());
    System.out.println("Amount: " + outstanding);
    System.out.println("Due: " + invoice.getDueDate());
}
```

## Java 11 Example

```java
// Java 11 adds var for local variables, making extractions cleaner
// Also demonstrates extracting with more modern API usage

// BEFORE
public String generateReport(List<Employee> employees, LocalDate reportDate) {
    // filter active employees
    var activeEmployees = new ArrayList<Employee>();
    for (var emp : employees) {
        if (emp.getStatus().equals("ACTIVE") && emp.getHireDate().isBefore(reportDate)) {
            activeEmployees.add(emp);
        }
    }

    // build header
    var sb = new StringBuilder();
    sb.append("Report Date: ").append(reportDate).append("\n");
    sb.append("Total Active: ").append(activeEmployees.size()).append("\n");
    sb.append("---\n");

    // build body
    for (var emp : activeEmployees) {
        sb.append(emp.getName()).append(" - ").append(emp.getDepartment()).append("\n");
    }

    return sb.toString();
}

// AFTER: Each responsibility has its own method
public String generateReport(List<Employee> employees, LocalDate reportDate) {
    var activeEmployees = filterActiveEmployees(employees, reportDate);
    return buildHeader(reportDate, activeEmployees.size())
         + buildBody(activeEmployees);
}

private List<Employee> filterActiveEmployees(List<Employee> employees, LocalDate reportDate) {
    return employees.stream()
            .filter(emp -> "ACTIVE".equals(emp.getStatus()))
            .filter(emp -> emp.getHireDate().isBefore(reportDate))
            .collect(Collectors.toList());  // or .toList() in Java 16+
}

private String buildHeader(LocalDate reportDate, int count) {
    // String.lines() and strip() are Java 11 features
    return "Report Date: " + reportDate + "\n"
         + "Total Active: " + count + "\n"
         + "---\n";
}

private String buildBody(List<Employee> employees) {
    return employees.stream()
            .map(emp -> emp.getName() + " - " + emp.getDepartment())
            .collect(Collectors.joining("\n"));
}
```

## Key Rule

> If you have to spend more than 5 seconds understanding what a block of code does, extract it into a method. The method name replaces the need for a comment.

## Related Smells

Long Method, Duplicated Code, Comments (as deodorant)

## Inverse

Inline Method (technique #02)
