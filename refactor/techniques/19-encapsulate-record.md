# Encapsulate Record

**Category:** Organizing Data
**Sources:** Fowler Ch.7

## Problem

A raw data structure (dictionary, hash, map, plain object) with known keys is used throughout the codebase. There is no behavior attached to the data, no validation, and any part of the system can add, remove, or modify keys without constraint.

## Motivation

Records (dicts/maps/hashes) are convenient for quick prototyping but dangerous at scale. When a dict with keys like `name` and `address` flows through multiple modules, any module can misspell a key, add unexpected keys, or forget required ones. Wrapping the record in a class or struct adds type safety, enables IDE autocompletion, and provides a natural home for behavior and validation.

## When to Apply

- A dict/map/hash with known keys is used repeatedly across the codebase
- You need to add behavior (computed properties, validation) to the data
- Typos in key names have caused bugs
- You want IDE support (autocomplete, type checking) for the data's fields

## Mechanics

1. Create a class/struct with fields matching the record's known keys
2. Add a constructor that accepts the raw data or individual fields
3. Add accessors (getters, and setters if mutable)
4. Replace raw data creation and access with the new type
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
customer = {"name": "Acme Corp", "address": "123 Main St", "city": "Springfield"}

def format_label(customer: dict) -> str:
    return f"{customer['name']}\n{customer['address']}\n{customer['city']}"

def update_address(customer: dict, new_address: str):
    customer["address"] = new_address

# AFTER
from dataclasses import dataclass

@dataclass
class Customer:
    name: str
    address: str
    city: str

    def format_label(self) -> str:
        return f"{self.name}\n{self.address}\n{self.city}"

    def with_address(self, new_address: str) -> "Customer":
        return Customer(name=self.name, address=new_address, city=self.city)

customer = Customer(name="Acme Corp", address="123 Main St", city="Springfield")
```

### TypeScript

```typescript
// BEFORE
const customer = { name: "Acme Corp", address: "123 Main St", city: "Springfield" };

function formatLabel(customer: Record<string, string>): string {
  return `${customer.name}\n${customer.address}\n${customer.city}`;
}

function updateAddress(customer: Record<string, string>, newAddress: string): void {
  customer.address = newAddress;
}

// AFTER
class Customer {
  constructor(
    public readonly name: string,
    private _address: string,
    public readonly city: string
  ) {}

  get address(): string {
    return this._address;
  }

  formatLabel(): string {
    return `${this.name}\n${this._address}\n${this.city}`;
  }

  withAddress(newAddress: string): Customer {
    return new Customer(this.name, newAddress, this.city);
  }
}

const customer = new Customer("Acme Corp", "123 Main St", "Springfield");
```

### Go

```go
// BEFORE
// customer := map[string]string{
//     "name": "Acme Corp", "address": "123 Main St", "city": "Springfield",
// }

// AFTER
type Customer struct {
	Name    string
	Address string
	City    string
}

func (c Customer) FormatLabel() string {
	return fmt.Sprintf("%s\n%s\n%s", c.Name, c.Address, c.City)
}

func (c Customer) WithAddress(newAddress string) Customer {
	c.Address = newAddress
	return c
}

customer := Customer{Name: "Acme Corp", Address: "123 Main St", City: "Springfield"}
```

### Rust

```rust
// BEFORE
// let customer: HashMap<&str, &str> = HashMap::from([
//     ("name", "Acme Corp"), ("address", "123 Main St"), ("city", "Springfield"),
// ]);

// AFTER
#[derive(Debug, Clone)]
struct Customer {
    name: String,
    address: String,
    city: String,
}

impl Customer {
    fn new(name: impl Into<String>, address: impl Into<String>, city: impl Into<String>) -> Self {
        Self { name: name.into(), address: address.into(), city: city.into() }
    }

    fn format_label(&self) -> String {
        format!("{}\n{}\n{}", self.name, self.address, self.city)
    }

    fn with_address(mut self, new_address: impl Into<String>) -> Self {
        self.address = new_address.into();
        self
    }
}

let customer = Customer::new("Acme Corp", "123 Main St", "Springfield");
```

## Related Smells

Data Class, Primitive Obsession

## Inverse

(none)
