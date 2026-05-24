# Move Statements into/out of Function / Slide Statements

**Category:** Moving Features
**Sources:** Fowler Ch.8

## Problem

Related code is scattered throughout a function. Statements that belong together are separated by unrelated code, making it hard to see the logical grouping. Or the same setup/cleanup code is duplicated around every call to a function.

## Motivation

Code is easier to understand when related statements sit together. Sliding statements closer to their logical partners makes the code read like a coherent narrative. Moving statements into a function eliminates duplication when every caller performs the same setup. Moving statements out of a function allows callers to vary their behavior.

## When to Apply

- A variable declaration is far from its first use
- The same setup or cleanup code appears before/after every call to a function
- Related statements are separated by unrelated lines
- You want to prepare code for Extract Method by grouping related logic

## Mechanics

1. Identify the statements that should be together
2. Check for data dependencies — can the statements be moved without changing behavior?
3. Slide statements to their new position (or into/out of the function)
4. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE — statements scattered
def process_order(order):
    shipping = calculate_shipping(order)
    price = order.quantity * order.item_price
    tracking_id = generate_tracking_id()
    discount = 0.0
    if price > 1000:
        discount = price * 0.05
    total = price - discount + shipping
    send_tracking_email(order.customer, tracking_id)
    return total

# AFTER — related statements grouped
def process_order(order):
    price = order.quantity * order.item_price
    discount = price * 0.05 if price > 1000 else 0.0
    shipping = calculate_shipping(order)
    total = price - discount + shipping

    tracking_id = generate_tracking_id()
    send_tracking_email(order.customer, tracking_id)

    return total
```

### TypeScript

```typescript
// BEFORE — statements scattered
function processOrder(order: Order): number {
  const shipping = calculateShipping(order);
  const price = order.quantity * order.itemPrice;
  const trackingId = generateTrackingId();
  let discount = 0;
  if (price > 1000) {
    discount = price * 0.05;
  }
  const total = price - discount + shipping;
  sendTrackingEmail(order.customer, trackingId);
  return total;
}

// AFTER — related statements grouped
function processOrder(order: Order): number {
  const price = order.quantity * order.itemPrice;
  const discount = price > 1000 ? price * 0.05 : 0;
  const shipping = calculateShipping(order);
  const total = price - discount + shipping;

  const trackingId = generateTrackingId();
  sendTrackingEmail(order.customer, trackingId);

  return total;
}
```

### Go

```go
// BEFORE — statements scattered
func ProcessOrder(order Order) float64 {
	shipping := CalculateShipping(order)
	price := float64(order.Quantity) * order.ItemPrice
	trackingID := GenerateTrackingID()
	discount := 0.0
	if price > 1000 {
		discount = price * 0.05
	}
	total := price - discount + shipping
	SendTrackingEmail(order.Customer, trackingID)
	return total
}

// AFTER — related statements grouped
func ProcessOrder(order Order) float64 {
	price := float64(order.Quantity) * order.ItemPrice
	discount := 0.0
	if price > 1000 {
		discount = price * 0.05
	}
	shipping := CalculateShipping(order)
	total := price - discount + shipping

	trackingID := GenerateTrackingID()
	SendTrackingEmail(order.Customer, trackingID)

	return total
}
```

### Rust

```rust
// BEFORE — statements scattered
fn process_order(order: &Order) -> f64 {
    let shipping = calculate_shipping(order);
    let price = order.quantity as f64 * order.item_price;
    let tracking_id = generate_tracking_id();
    let discount = if price > 1000.0 { price * 0.05 } else { 0.0 };
    let total = price - discount + shipping;
    send_tracking_email(&order.customer, &tracking_id);
    total
}

// AFTER — related statements grouped
fn process_order(order: &Order) -> f64 {
    let price = order.quantity as f64 * order.item_price;
    let discount = if price > 1000.0 { price * 0.05 } else { 0.0 };
    let shipping = calculate_shipping(order);
    let total = price - discount + shipping;

    let tracking_id = generate_tracking_id();
    send_tracking_email(&order.customer, &tracking_id);

    total
}
```

## Related Smells

Long Method, Duplicated Code

## Inverse

(none)
