# Split Phase

**Category:** Additional Techniques
**Sources:** Fowler Ch.6

## Problem

A block of code does two distinct things — mixing parsing with processing, validation with execution, or input transformation with business logic. The two concerns are interleaved, making the code hard to understand, test, and modify independently.

## Motivation

When code has two phases that operate on different conceptual levels (e.g., parsing raw input into a structured form, then processing that structured form), splitting them into separate functions makes each phase independently testable and replaceable. An intermediate data structure connects the phases, making the data flow explicit.

## When to Apply

- Code mixes input parsing/validation with business logic
- Two sequential concerns are interleaved in one function
- You want to test each phase independently
- The intermediate data between phases has a natural representation

## Mechanics

1. Identify the two phases and the boundary between them
2. Create an intermediate data structure that captures what phase 1 produces for phase 2
3. Extract phase 1 into a function that returns the intermediate data
4. Extract phase 2 into a function that takes the intermediate data
5. The original function becomes: intermediate = phase1(input); result = phase2(intermediate)
6. Test each phase independently

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def price_order(product_data: str) -> float:
    # Phase 1: parse
    parts = product_data.split(",")
    name = parts[0].strip()
    quantity = int(parts[1].strip())
    unit_price = float(parts[2].strip())
    # Phase 2: calculate
    base = quantity * unit_price
    discount = base * 0.1 if quantity > 100 else 0
    shipping = max(quantity * 0.5, 10.0)
    return base - discount + shipping

# AFTER
from dataclasses import dataclass

@dataclass
class OrderData:
    name: str
    quantity: int
    unit_price: float

def parse_order(raw: str) -> OrderData:
    parts = raw.split(",")
    return OrderData(
        name=parts[0].strip(),
        quantity=int(parts[1].strip()),
        unit_price=float(parts[2].strip()),
    )

def price_order(order: OrderData) -> float:
    base = order.quantity * order.unit_price
    discount = base * 0.1 if order.quantity > 100 else 0
    shipping = max(order.quantity * 0.5, 10.0)
    return base - discount + shipping

# Caller:
# order = parse_order("Widget, 150, 2.50")
# total = price_order(order)
```

### TypeScript

```typescript
// BEFORE
function priceOrder(productData: string): number {
  const parts = productData.split(",");
  const quantity = parseInt(parts[1].trim());
  const unitPrice = parseFloat(parts[2].trim());
  const base = quantity * unitPrice;
  const discount = quantity > 100 ? base * 0.1 : 0;
  const shipping = Math.max(quantity * 0.5, 10);
  return base - discount + shipping;
}

// AFTER
interface OrderData {
  name: string;
  quantity: number;
  unitPrice: number;
}

function parseOrder(raw: string): OrderData {
  const parts = raw.split(",");
  return {
    name: parts[0].trim(),
    quantity: parseInt(parts[1].trim()),
    unitPrice: parseFloat(parts[2].trim()),
  };
}

function priceOrder(order: OrderData): number {
  const base = order.quantity * order.unitPrice;
  const discount = order.quantity > 100 ? base * 0.1 : 0;
  const shipping = Math.max(order.quantity * 0.5, 10);
  return base - discount + shipping;
}

// Caller:
// const order = parseOrder("Widget, 150, 2.50");
// const total = priceOrder(order);
```

### Go

```go
// BEFORE
func PriceOrder(productData string) float64 {
	parts := strings.Split(productData, ",")
	quantity, _ := strconv.Atoi(strings.TrimSpace(parts[1]))
	unitPrice, _ := strconv.ParseFloat(strings.TrimSpace(parts[2]), 64)
	base := float64(quantity) * unitPrice
	discount := 0.0
	if quantity > 100 { discount = base * 0.1 }
	shipping := math.Max(float64(quantity)*0.5, 10)
	return base - discount + shipping
}

// AFTER
type OrderData struct {
	Name      string
	Quantity  int
	UnitPrice float64
}

func ParseOrder(raw string) (OrderData, error) {
	parts := strings.Split(raw, ",")
	qty, err := strconv.Atoi(strings.TrimSpace(parts[1]))
	if err != nil { return OrderData{}, err }
	price, err := strconv.ParseFloat(strings.TrimSpace(parts[2]), 64)
	if err != nil { return OrderData{}, err }
	return OrderData{
		Name:      strings.TrimSpace(parts[0]),
		Quantity:  qty,
		UnitPrice: price,
	}, nil
}

func PriceOrder(order OrderData) float64 {
	base := float64(order.Quantity) * order.UnitPrice
	discount := 0.0
	if order.Quantity > 100 { discount = base * 0.1 }
	shipping := math.Max(float64(order.Quantity)*0.5, 10)
	return base - discount + shipping
}
```

### Rust

```rust
// BEFORE
fn price_order(product_data: &str) -> f64 {
    let parts: Vec<&str> = product_data.split(',').collect();
    let quantity: i32 = parts[1].trim().parse().unwrap();
    let unit_price: f64 = parts[2].trim().parse().unwrap();
    let base = quantity as f64 * unit_price;
    let discount = if quantity > 100 { base * 0.1 } else { 0.0 };
    let shipping = (quantity as f64 * 0.5).max(10.0);
    base - discount + shipping
}

// AFTER
struct OrderData {
    name: String,
    quantity: i32,
    unit_price: f64,
}

fn parse_order(raw: &str) -> Result<OrderData, Box<dyn std::error::Error>> {
    let parts: Vec<&str> = raw.split(',').collect();
    Ok(OrderData {
        name: parts[0].trim().to_string(),
        quantity: parts[1].trim().parse()?,
        unit_price: parts[2].trim().parse()?,
    })
}

fn price_order(order: &OrderData) -> f64 {
    let base = order.quantity as f64 * order.unit_price;
    let discount = if order.quantity > 100 { base * 0.1 } else { 0.0 };
    let shipping = (order.quantity as f64 * 0.5).max(10.0);
    base - discount + shipping
}
```

## Related Smells

Long Method, Divergent Change

## Inverse

(none)
