# Replace Primitive with Object / Replace Data Value with Object

**Category:** Organizing Data
**Sources:** Fowler Ch.7, Shvets Ch.7
**Also known as:** Replace Data Value with Object

## Problem

A primitive field (string, int, float) represents a domain concept that deserves its own type. The raw value carries no validation, formatting, or behavior — "primitive obsession." Phone numbers stored as strings get formatted inconsistently, currency amounts as floats lose precision, and status codes as strings allow typos.

## Motivation

When a primitive starts accumulating logic around it (validation, formatting, comparison), it's time to promote it to a first-class domain object. This centralizes behavior, prevents invalid states, and makes the code self-documenting. A `PhoneNumber` type that validates on construction is far safer than a `str` that might contain anything.

## When to Apply

- A string holds a phone number, email, URL, or currency code
- A number is used as an ID, amount, or quantity with special rules
- A string represents a status, category, or type code with a finite set of valid values
- Validation logic for the same primitive is duplicated across the codebase
- You find formatting/parsing logic repeated for the same data

## Mechanics

1. Create a new class/struct for the domain concept
2. Add validation in the constructor/factory
3. Add formatting, comparison, and any behavior methods
4. Replace the primitive field with the new type
5. Update all callers to construct and use the new type
6. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Order:
    def __init__(self, customer_phone: str, total: float):
        self.customer_phone = customer_phone
        self.total = total

    def notify(self):
        # Validation duplicated everywhere phone is used
        if not self.customer_phone.startswith("+"):
            raise ValueError("Phone must include country code")
        formatted = f"({self.customer_phone[1:4]}) {self.customer_phone[4:7]}-{self.customer_phone[7:]}"
        send_sms(formatted, f"Order total: ${self.total:.2f}")

# AFTER
from dataclasses import dataclass
import re

@dataclass(frozen=True)
class PhoneNumber:
    value: str

    def __post_init__(self):
        if not re.match(r"^\+\d{10,15}$", self.value):
            raise ValueError(f"Invalid phone number: {self.value}")

    def formatted(self) -> str:
        digits = self.value[1:]
        return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"

class Order:
    def __init__(self, customer_phone: PhoneNumber, total: float):
        self.customer_phone = customer_phone
        self.total = total

    def notify(self):
        send_sms(self.customer_phone.formatted(), f"Order total: ${self.total:.2f}")
```

### TypeScript

```typescript
// BEFORE
class Order {
  constructor(
    public customerPhone: string,
    public total: number
  ) {}

  notify(): void {
    if (!this.customerPhone.startsWith("+")) {
      throw new Error("Phone must include country code");
    }
    const formatted = `(${this.customerPhone.slice(1, 4)}) ${this.customerPhone.slice(4, 7)}-${this.customerPhone.slice(7)}`;
    sendSms(formatted, `Order total: $${this.total.toFixed(2)}`);
  }
}

// AFTER
class PhoneNumber {
  private readonly value: string;

  constructor(value: string) {
    if (!/^\+\d{10,15}$/.test(value)) {
      throw new Error(`Invalid phone number: ${value}`);
    }
    this.value = value;
  }

  formatted(): string {
    const digits = this.value.slice(1);
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  equals(other: PhoneNumber): boolean {
    return this.value === other.value;
  }
}

class Order {
  constructor(
    public customerPhone: PhoneNumber,
    public total: number
  ) {}

  notify(): void {
    sendSms(this.customerPhone.formatted(), `Order total: $${this.total.toFixed(2)}`);
  }
}
```

### Go

```go
// BEFORE
type Order struct {
	CustomerPhone string
	Total         float64
}

func (o *Order) Notify() error {
	if !strings.HasPrefix(o.CustomerPhone, "+") {
		return errors.New("phone must include country code")
	}
	digits := o.CustomerPhone[1:]
	formatted := fmt.Sprintf("(%s) %s-%s", digits[:3], digits[3:6], digits[6:])
	return sendSMS(formatted, fmt.Sprintf("Order total: $%.2f", o.Total))
}

// AFTER
type PhoneNumber struct {
	value string
}

func NewPhoneNumber(raw string) (PhoneNumber, error) {
	matched, _ := regexp.MatchString(`^\+\d{10,15}$`, raw)
	if !matched {
		return PhoneNumber{}, fmt.Errorf("invalid phone number: %s", raw)
	}
	return PhoneNumber{value: raw}, nil
}

func (p PhoneNumber) Formatted() string {
	digits := p.value[1:]
	return fmt.Sprintf("(%s) %s-%s", digits[:3], digits[3:6], digits[6:])
}

type Order struct {
	CustomerPhone PhoneNumber
	Total         float64
}

func (o *Order) Notify() error {
	return sendSMS(o.CustomerPhone.Formatted(), fmt.Sprintf("Order total: $%.2f", o.Total))
}
```

### Rust

```rust
// BEFORE
struct Order {
    customer_phone: String,
    total: f64,
}

impl Order {
    fn notify(&self) -> Result<(), String> {
        if !self.customer_phone.starts_with('+') {
            return Err("Phone must include country code".into());
        }
        let digits = &self.customer_phone[1..];
        let formatted = format!("({}) {}-{}", &digits[..3], &digits[3..6], &digits[6..]);
        send_sms(&formatted, &format!("Order total: ${:.2}", self.total))
    }
}

// AFTER
#[derive(Debug, Clone, PartialEq, Eq)]
struct PhoneNumber(String);

impl PhoneNumber {
    fn new(raw: &str) -> Result<Self, String> {
        let valid = raw.starts_with('+')
            && raw[1..].len() >= 10
            && raw[1..].chars().all(|c| c.is_ascii_digit());
        if !valid {
            return Err(format!("Invalid phone number: {raw}"));
        }
        Ok(PhoneNumber(raw.to_string()))
    }

    fn formatted(&self) -> String {
        let digits = &self.0[1..];
        format!("({}) {}-{}", &digits[..3], &digits[3..6], &digits[6..])
    }
}

struct Order {
    customer_phone: PhoneNumber,
    total: f64,
}

impl Order {
    fn notify(&self) -> Result<(), String> {
        send_sms(&self.customer_phone.formatted(), &format!("Order total: ${:.2}", self.total))
    }
}
```

## Related Smells

Primitive Obsession, Data Clumps, Duplicated Code

## Inverse

(none)
