# Replace Method with Method Object

**Category:** Composing Methods
**Sources:** Fowler Ch.6, Shvets Ch.6

## Problem

You have a long method with so many intertwined local variables that Extract Method is impossible. Variables are assigned and reassigned, creating a web of dependencies.

## Motivation

When a method has so many local variables that you can't extract parts of it, turn the entire method into its own class. The local variables become fields of the class, and now you can freely decompose the method into smaller methods within that class. This is the "nuclear option" for monster methods.

## Java 8 Example

```java
// BEFORE: Monster method with tangled local variables
class Account {
    double gamma(double inputVal, int quantity, int yearToDate) {
        double importantValue1 = (inputVal * quantity) + delta();
        double importantValue2 = (inputVal * yearToDate) + 100;
        if ((yearToDate - importantValue1) > 100) {
            importantValue2 -= 20;
        }
        double importantValue3 = importantValue2 * 7;
        // ...30 more lines using these variables...
        return importantValue3 - 2 * importantValue1;
    }
}

// AFTER: Method Object — locals become fields, free to extract
class GammaCalculation {
    private final Account account;
    private final double inputVal;
    private final int quantity;
    private final int yearToDate;
    // Former local variables are now fields
    private double importantValue1;
    private double importantValue2;
    private double importantValue3;

    GammaCalculation(Account account, double inputVal, int quantity, int yearToDate) {
        this.account = account;
        this.inputVal = inputVal;
        this.quantity = quantity;
        this.yearToDate = yearToDate;
    }

    double compute() {
        importantValue1 = calculateImportantValue1();
        importantValue2 = calculateImportantValue2();
        adjustForYearToDate();
        importantValue3 = importantValue2 * 7;
        return importantValue3 - 2 * importantValue1;
    }

    // Now we can freely extract methods — they access fields directly
    private double calculateImportantValue1() {
        return (inputVal * quantity) + account.delta();
    }

    private double calculateImportantValue2() {
        return (inputVal * yearToDate) + 100;
    }

    private void adjustForYearToDate() {
        if ((yearToDate - importantValue1) > 100) {
            importantValue2 -= 20;
        }
    }
}

// Original method now delegates
class Account {
    double gamma(double inputVal, int quantity, int yearToDate) {
        return new GammaCalculation(this, inputVal, quantity, yearToDate).compute();
    }
}
```

## Java 11 Example

```java
// Same pattern with var and more modern style
class PricingCalculation {
    private final Order order;
    private final PricingRules rules;

    // Using Java 11 var in local contexts within methods
    double compute() {
        var baseAmount = calculateBase();
        var discounts = applyDiscounts(baseAmount);
        var taxes = calculateTaxes(baseAmount - discounts);
        return baseAmount - discounts + taxes;
    }

    private double calculateBase() {
        return order.getItems().stream()
                .mapToDouble(item -> item.getPrice() * item.getQuantity())
                .sum();
    }

    private double applyDiscounts(double base) {
        var volumeDiscount = rules.getVolumeDiscount(order.getTotalQuantity());
        var loyaltyDiscount = rules.getLoyaltyDiscount(order.getCustomer());
        return base * (volumeDiscount + loyaltyDiscount);
    }

    private double calculateTaxes(double taxableAmount) {
        return taxableAmount * rules.getTaxRate(order.getRegion());
    }
}
```

## Related Smells

Long Method, Large Class (sometimes the method object itself becomes a useful domain concept)
