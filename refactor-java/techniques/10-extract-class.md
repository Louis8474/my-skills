# Extract Class

**Category:** Moving Features
**Sources:** Fowler Ch.7-8, Shvets Ch.7

## Problem

A class does two or more things that could be separated. It has grown too large with too many fields and methods — a "God Class".

## Motivation

A class should have a single, well-defined responsibility. When a class accumulates responsibilities over time, extract a subset of fields and methods into a new class. Look for clusters of fields and methods that belong together (variable clustering).

## Java 8 Example

```java
// BEFORE: Person class handles personal info AND phone number formatting
class Person {
    private String name;
    private String officeAreaCode;
    private String officeNumber;

    String getName() { return name; }
    String getTelephoneNumber() {
        return "(" + officeAreaCode + ") " + officeNumber;
    }
    String getOfficeAreaCode() { return officeAreaCode; }
    void setOfficeAreaCode(String code) { officeAreaCode = code; }
    String getOfficeNumber() { return officeNumber; }
    void setOfficeNumber(String number) { officeNumber = number; }
}

// AFTER: telephone responsibility extracted into TelephoneNumber
class TelephoneNumber {
    private String areaCode;
    private String number;

    TelephoneNumber(String areaCode, String number) {
        this.areaCode = areaCode;
        this.number = number;
    }

    String getFormatted() {
        return "(" + areaCode + ") " + number;
    }

    // getters and setters
    String getAreaCode() { return areaCode; }
    String getNumber() { return number; }
}

class Person {
    private String name;
    private TelephoneNumber officeTelephone;

    String getName() { return name; }
    String getTelephoneNumber() {
        return officeTelephone.getFormatted();
    }
}
```

## Java 11 Example

```java
// BEFORE: Order handles pricing, tax, and shipping
class Order {
    private List<LineItem> items;
    private String customerRegion;
    private String shippingMethod;
    private Address shippingAddress;

    double getSubtotal() { /* ... */ }
    double getTaxRate() { /* uses customerRegion */ }
    double getTax() { return getSubtotal() * getTaxRate(); }
    double getShippingCost() { /* uses shippingMethod, shippingAddress, weight */ }
    double getTotal() { return getSubtotal() + getTax() + getShippingCost(); }
    boolean isFreeShipping() { return getSubtotal() > 100; }
    int estimateDeliveryDays() { /* uses shippingMethod, shippingAddress */ }
}

// AFTER: shipping responsibility extracted
class ShippingCalculator {
    private final String method;
    private final Address address;

    ShippingCalculator(String method, Address address) {
        this.method = method;
        this.address = address;
    }

    double calculateCost(double orderSubtotal, double totalWeight) {
        if (orderSubtotal > 100) return 0; // free shipping
        // ... shipping logic based on method, address, weight
        return 9.99;
    }

    int estimateDeliveryDays() {
        // ... logic based on method and address
        return "EXPRESS".equals(method) ? 2 : 7;
    }
}

class Order {
    private List<LineItem> items;
    private String customerRegion;
    private ShippingCalculator shipping;

    double getSubtotal() { /* ... */ }
    double getTax() { return getSubtotal() * getTaxRate(customerRegion); }
    double getShippingCost() { return shipping.calculateCost(getSubtotal(), getTotalWeight()); }
    double getTotal() { return getSubtotal() + getTax() + getShippingCost(); }
}
```

## Related Smells

Large Class, Divergent Change, Data Clumps

## Inverse

Inline Class (technique #11)
