# Introduce Special Case (Null Object Pattern)

**Category:** Simplifying Conditionals  
**Sources:** Fowler Ch.10, Shvets Ch.9

## Problem

Many places in the code check for the same special case (typically null or "unknown") and apply the same default behavior each time.

## Motivation

Instead of scattering null checks everywhere, create a special-case object that provides default behavior. Clients call methods normally without checking for null, and the special-case object returns sensible defaults. This is also known as the Null Object Pattern.

## Java 8 Example

```java
// BEFORE: null checks everywhere
class Site {
    Customer getCustomer() { /* might return null */ }
}

// In 10+ places across the codebase:
Customer customer = site.getCustomer();
String name = (customer == null) ? "occupant" : customer.getName();
BillingPlan plan = (customer == null) ? BillingPlan.basic() : customer.getBillingPlan();

// AFTER: Null Object eliminates all checks
class UnknownCustomer extends Customer {
    @Override String getName() { return "occupant"; }
    @Override BillingPlan getBillingPlan() { return BillingPlan.basic(); }
    @Override boolean isUnknown() { return true; }
}

class Site {
    Customer getCustomer() {
        return (customer != null) ? customer : new UnknownCustomer();
    }
}

// All client code becomes clean:
String name = site.getCustomer().getName();
BillingPlan plan = site.getCustomer().getBillingPlan();
```

## Java 11 Example

```java
// BEFORE: Optional.orElse scattered everywhere
var user = userRepo.findById(id);
var displayName = user.map(User::getDisplayName).orElse("Anonymous");
var permissions = user.map(User::getPermissions).orElse(Permissions.readOnly());
var avatar = user.map(User::getAvatarUrl).orElse("/img/default-avatar.png");

// AFTER: Guest user as special case
class GuestUser extends User {
    private static final GuestUser INSTANCE = new GuestUser();
    static GuestUser instance() { return INSTANCE; }

    @Override String getDisplayName() { return "Anonymous"; }
    @Override Permissions getPermissions() { return Permissions.readOnly(); }
    @Override String getAvatarUrl() { return "/img/default-avatar.png"; }
    @Override boolean isGuest() { return true; }
}

// Repository returns GuestUser instead of null/empty
User getUser(String id) {
    return userRepo.findById(id).orElse(GuestUser.instance());
}

// Client code — no conditionals needed
var displayName = getUser(id).getDisplayName();
var permissions = getUser(id).getPermissions();
```

## Related Smells

Temporary Field, Repeated null checks scattered across the codebase
