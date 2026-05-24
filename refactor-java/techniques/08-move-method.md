# Move Method

**Category:** Moving Features
**Sources:** Fowler Ch.8, Shvets Ch.7
**Also known as:** Move Function

## Problem

A method uses more features (fields, methods) of another class than the one it's defined in. It belongs elsewhere.

## Motivation

A function should live close to the data it uses most. When a method references more elements from another context than its own, it has Feature Envy and should be moved. Moving methods improves cohesion and reduces coupling.

## Java 8 Example

```java
// BEFORE: overdraftCharge in Account uses mostly AccountType data
class Account {
    private AccountType type;
    private int daysOverdrawn;

    double overdraftCharge() {
        if (type.isPremium()) {
            double baseCharge = 10;
            if (daysOverdrawn <= 7) return baseCharge;
            return baseCharge + (daysOverdrawn - 7) * 0.85;
        }
        return daysOverdrawn * 1.75;
    }
}

// AFTER: moved to AccountType where it has more cohesion
class AccountType {
    // Method now lives where it belongs
    double overdraftCharge(int daysOverdrawn) {
        if (isPremium()) {
            double baseCharge = 10;
            if (daysOverdrawn <= 7) return baseCharge;
            return baseCharge + (daysOverdrawn - 7) * 0.85;
        }
        return daysOverdrawn * 1.75;
    }
}

class Account {
    private AccountType type;
    private int daysOverdrawn;

    // Original delegates to the new location
    double overdraftCharge() {
        return type.overdraftCharge(daysOverdrawn);
    }
}
```

## Java 11 Example

```java
// BEFORE: discount logic in OrderService uses mostly Customer data
class OrderService {
    double calculateDiscount(Customer customer, Order order) {
        var yearsActive = Period.between(customer.getJoinDate(), LocalDate.now()).getYears();
        var totalSpent = customer.getOrderHistory().stream()
                .mapToDouble(Order::getTotal)
                .sum();

        if (yearsActive > 5 && totalSpent > 10_000) return 0.15;
        if (yearsActive > 2 && totalSpent > 5_000) return 0.10;
        if (totalSpent > 1_000) return 0.05;
        return 0;
    }
}

// AFTER: moved to Customer — this is really about customer loyalty
class Customer {
    double getLoyaltyDiscount() {
        var yearsActive = Period.between(joinDate, LocalDate.now()).getYears();
        var totalSpent = orderHistory.stream()
                .mapToDouble(Order::getTotal)
                .sum();

        if (yearsActive > 5 && totalSpent > 10_000) return 0.15;
        if (yearsActive > 2 && totalSpent > 5_000) return 0.10;
        if (totalSpent > 1_000) return 0.05;
        return 0;
    }
}
```

## Related Smells

Feature Envy, Shotgun Surgery, Divergent Change
