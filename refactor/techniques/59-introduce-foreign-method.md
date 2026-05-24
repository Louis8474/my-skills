# Introduce Foreign Method / Extension Method

**Category:** Additional Techniques
**Sources:** Shvets Ch.7

## Problem

You need to add behavior to a third-party type that you cannot modify. The utility logic is scattered across callers, duplicated wherever the behavior is needed.

## Motivation

When a library class is missing a method you need, you cannot add it directly. A foreign method (utility function that takes the type as its first argument) centralizes the logic in one place. This is better than duplicating the calculation at every call site. In languages with extension mechanisms, you can make it look like a natural method on the type.

## When to Apply

- A library type is missing a useful method
- The same utility calculation on a third-party type is duplicated across the codebase
- You cannot modify the source of the type (third-party, generated, frozen)
- The method logically belongs on the type but you do not own it

## Mechanics

1. Create a function that takes the third-party type as its first parameter
2. Implement the desired behavior
3. Replace all duplicated inline calculations with calls to the new function
4. Document that this is a "foreign method" — ideally it should be on the original type
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE — duplicated logic at every call site
from datetime import date, timedelta

order_date = date(2024, 12, 20)
# Skip weekends to find next business day — repeated everywhere
next_day = order_date + timedelta(days=1)
while next_day.weekday() >= 5:
    next_day += timedelta(days=1)

ship_date = date(2024, 12, 24)
next_biz = ship_date + timedelta(days=1)
while next_biz.weekday() >= 5:
    next_biz += timedelta(days=1)

# AFTER — foreign method centralizes the logic
from datetime import date, timedelta

def next_business_day(d: date) -> date:
    """Foreign method — ideally this would be on date itself."""
    result = d + timedelta(days=1)
    while result.weekday() >= 5:
        result += timedelta(days=1)
    return result

order_date = date(2024, 12, 20)
next_day = next_business_day(order_date)

ship_date = date(2024, 12, 24)
next_biz = next_business_day(ship_date)
```

### TypeScript

```typescript
// BEFORE — duplicated at every call site
const orderDate = new Date("2024-12-20");
let nextDay = new Date(orderDate);
nextDay.setDate(nextDay.getDate() + 1);
while (nextDay.getDay() === 0 || nextDay.getDay() === 6) {
  nextDay.setDate(nextDay.getDate() + 1);
}

// AFTER — foreign method
function nextBusinessDay(d: Date): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + 1);
  while (result.getDay() === 0 || result.getDay() === 6) {
    result.setDate(result.getDate() + 1);
  }
  return result;
}

const orderDate = new Date("2024-12-20");
const nextDay = nextBusinessDay(orderDate);
```

### Go

```go
// Go: package-level functions are the idiomatic way to extend types you don't own.

// BEFORE — duplicated inline
// t := time.Now()
// next := t.AddDate(0, 0, 1)
// for next.Weekday() == time.Saturday || next.Weekday() == time.Sunday {
//     next = next.AddDate(0, 0, 1)
// }

// AFTER — foreign function in your package
func NextBusinessDay(t time.Time) time.Time {
	next := t.AddDate(0, 0, 1)
	for next.Weekday() == time.Saturday || next.Weekday() == time.Sunday {
		next = next.AddDate(0, 0, 1)
	}
	return next
}

// Caller:
// delivery := NextBusinessDay(time.Now())
```

### Rust

```rust
// Rust: use an extension trait to add methods to types you don't own.

use chrono::{NaiveDate, Datelike, Weekday, Duration};

// BEFORE — duplicated inline
// let next = order_date + Duration::days(1);
// ... manual weekend loop ...

// AFTER — extension trait
trait BusinessDayExt {
    fn next_business_day(&self) -> NaiveDate;
}

impl BusinessDayExt for NaiveDate {
    fn next_business_day(&self) -> NaiveDate {
        let mut next = *self + Duration::days(1);
        while matches!(next.weekday(), Weekday::Sat | Weekday::Sun) {
            next += Duration::days(1);
        }
        next
    }
}

// Caller:
// use crate::BusinessDayExt; // import the trait
// let delivery = order_date.next_business_day();
```

## Related Smells

(extension, encapsulation, Duplicated Code)

## Inverse

(none)
