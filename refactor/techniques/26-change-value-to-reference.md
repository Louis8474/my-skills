# Change Value to Reference

**Category:** Organizing Data
**Sources:** Fowler Ch.7, Shvets Ch.7

## Problem

The same conceptual entity is duplicated as value objects across the system. When the entity needs to be updated, every copy must be found and changed — a recipe for inconsistency. For example, the same customer's data is embedded in every order, and a name change requires updating dozens of records.

## Motivation

When an object has identity (a customer, a user, a product), it should exist once and be referenced everywhere. This ensures updates propagate automatically and prevents data inconsistency. A registry, repository, or dependency injection provides the single source of truth.

## When to Apply

- Multiple objects embed copies of the same entity (customer, user, account)
- Updates to the entity must propagate to all users of that data
- Entity has a natural identity (ID, unique key)
- You find yourself updating the same data in multiple places

## Mechanics

1. Create a registry/repository for the shared entity
2. Replace embedded value copies with references (ID + lookup, or direct reference)
3. Ensure the entity is created once and retrieved from the registry
4. Update all code that modifies the entity to go through the registry
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE — Customer duplicated as value in every Order
class Customer:
    def __init__(self, customer_id: str, name: str):
        self.customer_id = customer_id
        self.name = name

class Order:
    def __init__(self, customer_id: str, customer_name: str, amount: float):
        self.customer = Customer(customer_id, customer_name)  # new copy each time
        self.amount = amount

# Updating customer name requires finding every Order
order1 = Order("C001", "Alice", 100)
order2 = Order("C001", "Alice", 200)
# If Alice changes name, both orders have stale data

# AFTER — shared Customer reference via registry
class CustomerRepository:
    _customers: dict[str, Customer] = {}

    @classmethod
    def get(cls, customer_id: str) -> Customer:
        return cls._customers[customer_id]

    @classmethod
    def register(cls, customer: Customer):
        cls._customers[customer.customer_id] = customer

class Order:
    def __init__(self, customer_id: str, amount: float):
        self.customer_id = customer_id
        self.amount = amount

    @property
    def customer(self) -> Customer:
        return CustomerRepository.get(self.customer_id)

# All orders see the same customer — name change propagates automatically
```

### TypeScript

```typescript
// BEFORE — duplicated customer data
class Order {
  customer: Customer;
  constructor(customerId: string, customerName: string, public amount: number) {
    this.customer = new Customer(customerId, customerName); // copy
  }
}

// AFTER — shared reference via registry
class CustomerRepository {
  private static customers = new Map<string, Customer>();

  static register(customer: Customer): void {
    this.customers.set(customer.id, customer);
  }

  static get(id: string): Customer {
    const customer = this.customers.get(id);
    if (!customer) throw new Error(`Unknown customer: ${id}`);
    return customer;
  }
}

class Order {
  constructor(
    public readonly customerId: string,
    public readonly amount: number
  ) {}

  get customer(): Customer {
    return CustomerRepository.get(this.customerId);
  }
}
```

### Go

```go
// BEFORE — customer copied into every order
type Order struct {
	Customer Customer
	Amount   float64
}

func NewOrder(id, name string, amount float64) Order {
	return Order{
		Customer: Customer{ID: id, Name: name}, // new copy
		Amount:   amount,
	}
}

// AFTER — shared reference via repository
type CustomerRepository struct {
	customers map[string]*Customer
}

func (r *CustomerRepository) Get(id string) *Customer {
	return r.customers[id]
}

func (r *CustomerRepository) Register(c *Customer) {
	r.customers[c.ID] = c
}

type Order struct {
	CustomerID string
	Amount     float64
	repo       *CustomerRepository
}

func (o *Order) Customer() *Customer {
	return o.repo.Get(o.CustomerID)
}
```

### Rust

```rust
// BEFORE — customer cloned into every order
#[derive(Clone)]
struct Customer {
    id: String,
    name: String,
}

struct Order {
    customer: Customer, // owned copy
    amount: f64,
}

// AFTER — shared reference via Rc (single-threaded) or Arc (multi-threaded)
use std::collections::HashMap;
use std::rc::Rc;

struct CustomerRepository {
    customers: HashMap<String, Rc<Customer>>,
}

impl CustomerRepository {
    fn get(&self, id: &str) -> Option<Rc<Customer>> {
        self.customers.get(id).cloned()
    }

    fn register(&mut self, customer: Customer) {
        self.customers.insert(customer.id.clone(), Rc::new(customer));
    }
}

struct Order {
    customer: Rc<Customer>, // shared reference
    amount: f64,
}
```

## Related Smells

Data Clumps, Duplicated Code

## Inverse

Change Reference to Value (#25)
