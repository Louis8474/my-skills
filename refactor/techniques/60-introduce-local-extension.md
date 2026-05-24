# Introduce Local Extension / Wrapper

**Category:** Additional Techniques
**Sources:** Shvets Ch.7

## Problem

You need to add many methods to a third-party type you cannot modify. Having numerous foreign methods scattered across the codebase becomes unwieldy — the extension behavior has no cohesive home.

## Motivation

When a single foreign method is not enough — when you need several related methods on a type you do not own — a local extension wraps the original type and adds the missing behavior in one place. The wrapper delegates to the original for existing behavior and adds new methods. This is cleaner than a proliferation of standalone utility functions.

## When to Apply

- You have three or more foreign methods for the same third-party type
- The utility functions logically form a cohesive set of behaviors
- You want the extended type to feel like a natural, richer version of the original
- A thin wrapper would simplify client code significantly

## Mechanics

1. Create a wrapper class/struct that holds the original type
2. Delegate existing methods to the wrapped instance
3. Add new methods directly on the wrapper
4. Replace usage of the original type with the wrapper where the extensions are needed
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE — many foreign methods for datetime.date
from datetime import date, timedelta

def next_business_day(d: date) -> date:
    result = d + timedelta(days=1)
    while result.weekday() >= 5:
        result += timedelta(days=1)
    return result

def is_quarter_end(d: date) -> bool:
    return d.month in (3, 6, 9, 12) and d == _last_day_of_month(d)

def days_until_quarter_end(d: date) -> int: ...
# More foreign methods accumulating...

# AFTER — local extension wraps date
from datetime import date, timedelta
import calendar

class BusinessDate:
    def __init__(self, d: date):
        self._date = d

    @property
    def date(self) -> date:
        return self._date

    def next_business_day(self) -> "BusinessDate":
        result = self._date + timedelta(days=1)
        while result.weekday() >= 5:
            result += timedelta(days=1)
        return BusinessDate(result)

    def is_quarter_end(self) -> bool:
        last_day = calendar.monthrange(self._date.year, self._date.month)[1]
        return self._date.month in (3, 6, 9, 12) and self._date.day == last_day

    def is_weekend(self) -> bool:
        return self._date.weekday() >= 5

    def __eq__(self, other):
        return isinstance(other, BusinessDate) and self._date == other._date
```

### TypeScript

```typescript
// BEFORE — many utility functions for Date
function nextBusinessDay(d: Date): Date { /* ... */ }
function isQuarterEnd(d: Date): boolean { /* ... */ }
function isWeekend(d: Date): boolean { /* ... */ }

// AFTER — local extension wraps Date
class BusinessDate {
  constructor(private readonly date: Date) {}

  toDate(): Date { return new Date(this.date); }

  nextBusinessDay(): BusinessDate {
    const result = new Date(this.date);
    result.setDate(result.getDate() + 1);
    while (result.getDay() === 0 || result.getDay() === 6) {
      result.setDate(result.getDate() + 1);
    }
    return new BusinessDate(result);
  }

  isQuarterEnd(): boolean {
    const month = this.date.getMonth(); // 0-based
    const lastDay = new Date(this.date.getFullYear(), month + 1, 0).getDate();
    return [2, 5, 8, 11].includes(month) && this.date.getDate() === lastDay;
  }

  isWeekend(): boolean {
    const day = this.date.getDay();
    return day === 0 || day === 6;
  }
}
```

### Go

```go
// Go: wrapper struct with the original type embedded or as a field.

// BEFORE — many package-level functions for time.Time
// func NextBusinessDay(t time.Time) time.Time { ... }
// func IsQuarterEnd(t time.Time) bool { ... }
// func IsWeekend(t time.Time) bool { ... }

// AFTER — wrapper struct
type BusinessDate struct {
	time.Time // embed to inherit String(), Format(), etc.
}

func NewBusinessDate(t time.Time) BusinessDate {
	return BusinessDate{Time: t}
}

func (d BusinessDate) NextBusinessDay() BusinessDate {
	next := d.AddDate(0, 0, 1)
	for next.Weekday() == time.Saturday || next.Weekday() == time.Sunday {
		next = next.AddDate(0, 0, 1)
	}
	return BusinessDate{Time: next}
}

func (d BusinessDate) IsQuarterEnd() bool {
	month := d.Month()
	if month != 3 && month != 6 && month != 9 && month != 12 {
		return false
	}
	tomorrow := d.AddDate(0, 0, 1)
	return tomorrow.Month() != month
}

func (d BusinessDate) IsWeekend() bool {
	wd := d.Weekday()
	return wd == time.Saturday || wd == time.Sunday
}
```

### Rust

```rust
// Rust: newtype pattern wraps the original type.

use chrono::{NaiveDate, Datelike, Weekday, Duration};

// AFTER — newtype wrapper
struct BusinessDate(NaiveDate);

impl BusinessDate {
    fn new(date: NaiveDate) -> Self {
        Self(date)
    }

    fn date(&self) -> NaiveDate {
        self.0
    }

    fn next_business_day(&self) -> Self {
        let mut next = self.0 + Duration::days(1);
        while matches!(next.weekday(), Weekday::Sat | Weekday::Sun) {
            next += Duration::days(1);
        }
        Self(next)
    }

    fn is_quarter_end(&self) -> bool {
        let month = self.0.month();
        if !matches!(month, 3 | 6 | 9 | 12) {
            return false;
        }
        let next_day = self.0 + Duration::days(1);
        next_day.month() != month
    }

    fn is_weekend(&self) -> bool {
        matches!(self.0.weekday(), Weekday::Sat | Weekday::Sun)
    }
}
```

## Related Smells

(extension, cohesion)

## Inverse

(none)
