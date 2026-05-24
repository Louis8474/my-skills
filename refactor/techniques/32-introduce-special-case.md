# Introduce Special Case / Null Object

**Category:** Simplifying Conditionals
**Sources:** Fowler Ch.10, Shvets Ch.9
**Also known as:** Null Object Pattern

## Problem

Null/None/nil checks for a common case are scattered throughout the codebase. Every place that uses a value must first check if it's null and provide a default. This duplicates the default logic and clutters the code with defensive checks.

## Motivation

A Special Case object provides the default behavior directly, eliminating the need for null checks. The calling code treats the special case like any other instance — no branching required. This is especially powerful when the "missing" case has consistent default behavior (e.g., unknown customer always returns "Occupant" for name).

## When to Apply

- The same null/None check appears in 3+ places with the same default
- A "missing" entity has well-defined default behavior
- You find `if x is None: return default` duplicated everywhere
- You want to eliminate `Optional` unwrapping boilerplate

## Mechanics

1. Create a Special Case subclass/implementation with default behavior
2. Add a factory method or detection predicate (`is_unknown`, etc.)
3. Replace null checks at the source: return the Special Case object instead of null
4. Remove null checks at each call site — the Special Case handles them
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Site:
    def __init__(self, customer: Customer | None):
        self.customer = customer

# Null checks duplicated everywhere
def customer_name(site: Site) -> str:
    if site.customer is None:
        return "Occupant"
    return site.customer.name

def billing_plan(site: Site) -> BillingPlan:
    if site.customer is None:
        return BillingPlan.basic()
    return site.customer.billing_plan

def weeks_delinquent(site: Site) -> int:
    if site.customer is None:
        return 0
    return site.customer.payment_history.weeks_delinquent

# AFTER
class UnknownCustomer:
    @property
    def name(self) -> str:
        return "Occupant"

    @property
    def billing_plan(self) -> BillingPlan:
        return BillingPlan.basic()

    @property
    def payment_history(self) -> PaymentHistory:
        return NullPaymentHistory()

class NullPaymentHistory:
    @property
    def weeks_delinquent(self) -> int:
        return 0

class Site:
    def __init__(self, customer: Customer | None):
        self._customer = customer

    @property
    def customer(self) -> Customer | UnknownCustomer:
        return self._customer if self._customer is not None else UnknownCustomer()

# No more null checks — calling code is uniform
def customer_name(site: Site) -> str:
    return site.customer.name  # works for both real and unknown

def billing_plan(site: Site) -> BillingPlan:
    return site.customer.billing_plan

def weeks_delinquent(site: Site) -> int:
    return site.customer.payment_history.weeks_delinquent
```

### TypeScript

```typescript
// BEFORE
function customerName(site: Site): string {
  return site.customer ? site.customer.name : "Occupant";
}

function billingPlan(site: Site): BillingPlan {
  return site.customer ? site.customer.billingPlan : BillingPlan.basic();
}

// AFTER
class UnknownCustomer implements Customer {
  get name(): string { return "Occupant"; }
  get billingPlan(): BillingPlan { return BillingPlan.basic(); }
  get paymentHistory(): PaymentHistory { return new NullPaymentHistory(); }
  get isUnknown(): boolean { return true; }
}

class Site {
  private _customer: Customer | null;

  get customer(): Customer {
    return this._customer ?? new UnknownCustomer();
  }
}

// No null checks needed
function customerName(site: Site): string {
  return site.customer.name;
}

function billingPlan(site: Site): BillingPlan {
  return site.customer.billingPlan;
}
```

### Go

```go
// BEFORE
func customerName(site Site) string {
	if site.Customer == nil {
		return "Occupant"
	}
	return site.Customer.Name
}

func billingPlan(site Site) BillingPlan {
	if site.Customer == nil {
		return BasicPlan()
	}
	return site.Customer.BillingPlan
}

// AFTER — use interface to represent both real and unknown customers
type Customer interface {
	Name() string
	BillingPlan() BillingPlan
	IsUnknown() bool
}

type RealCustomer struct {
	name        string
	billingPlan BillingPlan
}

func (c RealCustomer) Name() string           { return c.name }
func (c RealCustomer) BillingPlan() BillingPlan { return c.billingPlan }
func (c RealCustomer) IsUnknown() bool         { return false }

type UnknownCustomer struct{}

func (u UnknownCustomer) Name() string           { return "Occupant" }
func (u UnknownCustomer) BillingPlan() BillingPlan { return BasicPlan() }
func (u UnknownCustomer) IsUnknown() bool         { return true }

// No nil checks — Site always returns a valid Customer
func (s Site) GetCustomer() Customer {
	if s.customer == nil {
		return UnknownCustomer{}
	}
	return s.customer
}
```

### Rust

```rust
// BEFORE
fn customer_name(site: &Site) -> &str {
    match &site.customer {
        Some(c) => &c.name,
        None => "Occupant",
    }
}

fn billing_plan(site: &Site) -> BillingPlan {
    match &site.customer {
        Some(c) => c.billing_plan.clone(),
        None => BillingPlan::basic(),
    }
}

// AFTER — use enum to represent both cases
enum Customer {
    Known { name: String, billing_plan: BillingPlan },
    Unknown,
}

impl Customer {
    fn name(&self) -> &str {
        match self {
            Customer::Known { name, .. } => name,
            Customer::Unknown => "Occupant",
        }
    }

    fn billing_plan(&self) -> BillingPlan {
        match self {
            Customer::Known { billing_plan, .. } => billing_plan.clone(),
            Customer::Unknown => BillingPlan::basic(),
        }
    }

    fn is_unknown(&self) -> bool {
        matches!(self, Customer::Unknown)
    }
}

// Site always provides a Customer — no Option needed at call sites
struct Site {
    customer: Customer, // never Option
}

fn customer_name(site: &Site) -> &str {
    site.customer.name()
}
```

## Related Smells

Duplicated Code (null checks), Primitive Obsession

## Inverse

(none)
