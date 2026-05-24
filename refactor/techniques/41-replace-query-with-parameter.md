# Replace Query with Parameter

**Category:** Simplifying Method Calls
**Sources:** Fowler Ch.6

## Problem

A function reaches into global state, a singleton, or an external service to get a value it needs. This hidden dependency makes the function impure, hard to test, and tightly coupled to the environment. Tests must set up global state or mock singletons just to exercise the function.

## Motivation

Moving the dependency from inside the function to a parameter makes the function pure (or purer): given the same inputs, it returns the same output. This makes the function testable with simple arguments, eliminates hidden coupling, and makes the dependency explicit in the signature. The caller assumes responsibility for providing the value, which is appropriate since the caller has more context about the environment.

## When to Apply

- Function reads from global/static config, environment variables, or singletons
- Function is hard to test because it depends on external state
- You want to make a function pure for easier reasoning and testing
- The function's behavior changes based on hidden state that callers don't see

## Mechanics

1. Identify the internal query (global read, singleton access, env lookup)
2. Add a parameter for the queried value
3. Replace the internal query with use of the new parameter
4. Update all callers to provide the value
5. Test — the function is now testable with direct arguments

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE — hidden dependency on global config
from config import Config

class PriceCalculator:
    def final_price(self, base_price: float) -> float:
        tax_rate = Config.get("TAX_RATE")     # hidden dependency
        discount = Config.get("DISCOUNT")      # hidden dependency
        return base_price * (1 + tax_rate) * (1 - discount)

# Testing requires mocking Config — fragile
def test_final_price():
    with mock.patch.dict(Config._data, {"TAX_RATE": 0.1, "DISCOUNT": 0.05}):
        calc = PriceCalculator()
        assert calc.final_price(100) == 104.5

# AFTER — dependencies explicit as parameters
class PriceCalculator:
    def final_price(self, base_price: float, tax_rate: float, discount: float) -> float:
        return base_price * (1 + tax_rate) * (1 - discount)

# Testing is straightforward — no mocking needed
def test_final_price():
    calc = PriceCalculator()
    assert calc.final_price(100, tax_rate=0.1, discount=0.05) == 104.5

# Caller provides the values from whatever source is appropriate
price = calc.final_price(100, Config.get("TAX_RATE"), Config.get("DISCOUNT"))
```

### TypeScript

```typescript
// BEFORE — reads from singleton
class ThermostatControl {
  targetTemperature(): number {
    const currentTemp = Thermostat.getInstance().currentTemperature; // hidden dependency
    const plan = HeatingPlan.getCurrent(); // hidden dependency
    if (currentTemp > plan.max) return plan.max;
    if (currentTemp < plan.min) return plan.min;
    return currentTemp;
  }
}

// AFTER — dependencies as parameters
class ThermostatControl {
  targetTemperature(currentTemp: number, plan: HeatingPlan): number {
    if (currentTemp > plan.max) return plan.max;
    if (currentTemp < plan.min) return plan.min;
    return currentTemp;
  }
}

// Caller provides the values
const target = control.targetTemperature(
  thermostat.currentTemperature,
  HeatingPlan.getCurrent()
);

// Testing is trivial
expect(control.targetTemperature(30, { min: 18, max: 25 })).toBe(25);
```

### Go

```go
// BEFORE — reads environment variable directly
func ConnectionString() string {
	host := os.Getenv("DB_HOST")    // hidden dependency
	port := os.Getenv("DB_PORT")    // hidden dependency
	return fmt.Sprintf("postgres://%s:%s/mydb", host, port)
}

// AFTER — explicit parameters
func ConnectionString(host, port string) string {
	return fmt.Sprintf("postgres://%s:%s/mydb", host, port)
}

// Caller provides the values
connStr := ConnectionString(os.Getenv("DB_HOST"), os.Getenv("DB_PORT"))

// Testing is simple
func TestConnectionString(t *testing.T) {
	got := ConnectionString("localhost", "5432")
	want := "postgres://localhost:5432/mydb"
	if got != want {
		t.Errorf("got %s, want %s", got, want)
	}
}
```

### Rust

```rust
// BEFORE — reads from static config
fn shipping_cost(weight: f64) -> f64 {
    let rate = CONFIG.get("SHIPPING_RATE")  // hidden static dependency
        .unwrap()
        .parse::<f64>()
        .unwrap();
    weight * rate
}

// AFTER — explicit parameter
fn shipping_cost(weight: f64, rate_per_kg: f64) -> f64 {
    weight * rate_per_kg
}

// Caller provides the value
let cost = shipping_cost(5.0, config.shipping_rate);

// Testing is simple
#[test]
fn test_shipping_cost() {
    assert!((shipping_cost(5.0, 2.5) - 12.5).abs() < f64::EPSILON);
}
```

## Related Smells

Long Parameter List (tension with this refactoring — use judgment), Hidden Dependencies

## Inverse

Replace Parameter with Query (#40)
