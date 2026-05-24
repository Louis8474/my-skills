# Remove Flag Argument

**Category:** Simplifying Method Calls
**Sources:** Fowler Ch.6, Shvets Ch.10

## Problem

A boolean parameter selects between two behaviors inside a function. At the call site, `process(true)` or `setDimension(name, value, false)` is unreadable — the reader must look up the function signature to understand what `true`/`false` means. The function also violates the Single Responsibility Principle by doing two things.

## Motivation

Replacing a flag argument with separate, well-named functions makes each call site self-documenting. The caller's intent is clear from the function name alone. Each function also becomes simpler because it handles only one path.

## When to Apply

- A boolean parameter switches between two distinct behaviors
- Call sites like `book(true)` or `render(false)` are unreadable
- The function has an if/else controlled entirely by the boolean param
- The two behaviors are different enough to warrant separate names

## Mechanics

1. Create a separate function for each value of the flag
2. Move the corresponding logic into each new function
3. Replace all call sites with the appropriate named function
4. Remove the original function (or make it private, delegating to the two new ones)
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def set_dimension(name: str, value: float, is_metric: bool) -> None:
    if is_metric:
        self.dimensions[name] = value
    else:
        self.dimensions[name] = value * 25.4  # convert inches to mm

# Call site — what does True mean here?
set_dimension("width", 100, True)
set_dimension("height", 4, False)

# AFTER
def set_metric_dimension(name: str, value_mm: float) -> None:
    self.dimensions[name] = value_mm

def set_imperial_dimension(name: str, value_inches: float) -> None:
    self.dimensions[name] = value_inches * 25.4

# Call sites are self-documenting
set_metric_dimension("width", 100)
set_imperial_dimension("height", 4)
```

### TypeScript

```typescript
// BEFORE
function bookConcert(customer: Customer, isPremium: boolean): Booking {
  if (isPremium) {
    return new PremiumBooking(customer, findBestSeat(), includeDrinks());
  } else {
    return new Booking(customer, findAvailableSeat());
  }
}

// Call site — what does true mean?
const booking = bookConcert(customer, true);

// AFTER
function bookStandardConcert(customer: Customer): Booking {
  return new Booking(customer, findAvailableSeat());
}

function bookPremiumConcert(customer: Customer): PremiumBooking {
  return new PremiumBooking(customer, findBestSeat(), includeDrinks());
}

// Call sites are clear
const booking = bookPremiumConcert(customer);
```

### Go

```go
// BEFORE
func CreateAddress(street, city string, international bool) string {
	if international {
		return fmt.Sprintf("%s\n%s\nINTERNATIONAL", street, city)
	}
	return fmt.Sprintf("%s\n%s", street, city)
}

// Call site — what does false mean?
addr := CreateAddress("123 Main", "Springfield", false)

// AFTER
func CreateDomesticAddress(street, city string) string {
	return fmt.Sprintf("%s\n%s", street, city)
}

func CreateInternationalAddress(street, city string) string {
	return fmt.Sprintf("%s\n%s\nINTERNATIONAL", street, city)
}

// Call site is obvious
addr := CreateDomesticAddress("123 Main", "Springfield")
```

### Rust

```rust
// BEFORE
fn render_page(content: &str, is_draft: bool) -> String {
    if is_draft {
        format!("[DRAFT] {content}\n--- NOT FOR PUBLICATION ---")
    } else {
        format!("{content}\n--- Published ---")
    }
}

// Call site — what does false mean?
let html = render_page(&content, false);

// AFTER
fn render_draft(content: &str) -> String {
    format!("[DRAFT] {content}\n--- NOT FOR PUBLICATION ---")
}

fn render_published(content: &str) -> String {
    format!("{content}\n--- Published ---")
}

// Call site is clear
let html = render_published(&content);
```

## Related Smells

Long Parameter List, Long Method

## Inverse

(none)
