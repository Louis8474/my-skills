# Preserve Whole Object

**Category:** Simplifying Method Calls  
**Sources:** Fowler Ch.11, Shvets Ch.10

## Problem

You extract several values from an object and pass them as individual parameters to a method. If the method later needs more data from that object, you must change its signature.

## Motivation

Instead of extracting values, pass the whole object. This reduces parameter count, creates an explicit dependency, and makes future changes easier — if you need more data, you don't have to change the signature.

## Java 8 Example

```java
// BEFORE: extracting values
int low = daysTempRange.getLow();
int high = daysTempRange.getHigh();
boolean withinPlan = plan.withinRange(low, high);

// AFTER: pass the whole range object
boolean withinPlan = plan.withinRange(daysTempRange);

class HeatingPlan {
    boolean withinRange(TempRange range) {
        return range.getLow() >= this.temperatureFloor
            && range.getHigh() <= this.temperatureCeiling;
    }
}
```

## Java 11 Example

```java
// BEFORE: extracting fields from request
void processPayment(String cardNumber, String expiry,
                    String cvv, double amount, String currency) { ... }

// AFTER: pass the whole PaymentRequest
void processPayment(PaymentRequest request) {
    var card = request.getCardNumber();
    var amount = request.getAmount();
    // If we need more data later, no signature change needed
}
```

## When NOT to Apply

If you don't want the callee to depend on the whole object (e.g., to keep it testable with simple parameters), keep the individual parameters.

## Related Smells

Long Parameter List, Data Clumps
