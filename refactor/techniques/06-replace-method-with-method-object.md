# Replace Method with Method Object / Replace Function with Command

**Category:** Composing Methods
**Sources:** Fowler Ch.6, Shvets Ch.6
**Also known as:** Replace Function with Command

## Problem

A long function has many local variables that are intertwined, making it impossible to apply Extract Method. The local variables are read and written across the function, creating a tangled web of dependencies.

## Motivation

By turning the function into its own class or struct, all local variables become fields. This eliminates the parameter-passing problem entirely. Once the logic lives in a dedicated object, you can freely extract methods from it without worrying about passing a dozen parameters around.

## When to Apply

- A function is too long but cannot be broken down because of many interrelated local variables
- Multiple temps are assigned and re-assigned throughout the function
- Extract Method would require passing too many parameters
- The function represents a distinct computation that deserves its own identity

## Mechanics

1. Create a new class/struct named after the function's purpose
2. Add a field for each local variable and each parameter of the original function
3. Create a constructor/`new` that takes the original parameters
4. Move the function body into an `execute` or `run` method
5. Replace the original function body with creation and delegation to the new object
6. Now you can freely extract methods from the command object

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Account:
    def gamma(self, input_val: float, quantity: int, year_to_date: float) -> float:
        important_value1 = (input_val * quantity) + self._delta()
        important_value2 = (input_val * year_to_date) + 100
        if year_to_date - important_value1 > 100:
            important_value2 -= 20
        important_value3 = important_value2 * 7
        return important_value3 - 2 * important_value1

# AFTER
class GammaCalculator:
    def __init__(self, account: "Account", input_val: float, quantity: int, year_to_date: float):
        self.account = account
        self.input_val = input_val
        self.quantity = quantity
        self.year_to_date = year_to_date
        self.important_value1 = 0.0
        self.important_value2 = 0.0
        self.important_value3 = 0.0

    def compute(self) -> float:
        self.important_value1 = (self.input_val * self.quantity) + self.account._delta()
        self.important_value2 = (self.input_val * self.year_to_date) + 100
        self._adjust_for_year()
        self.important_value3 = self.important_value2 * 7
        return self.important_value3 - 2 * self.important_value1

    def _adjust_for_year(self):
        if self.year_to_date - self.important_value1 > 100:
            self.important_value2 -= 20

class Account:
    def gamma(self, input_val: float, quantity: int, year_to_date: float) -> float:
        return GammaCalculator(self, input_val, quantity, year_to_date).compute()
```

### TypeScript

```typescript
// BEFORE
class Account {
  gamma(inputVal: number, quantity: number, yearToDate: number): number {
    const importantValue1 = inputVal * quantity + this.delta();
    let importantValue2 = inputVal * yearToDate + 100;
    if (yearToDate - importantValue1 > 100) {
      importantValue2 -= 20;
    }
    const importantValue3 = importantValue2 * 7;
    return importantValue3 - 2 * importantValue1;
  }
}

// AFTER
class GammaCalculator {
  private importantValue1 = 0;
  private importantValue2 = 0;
  private importantValue3 = 0;

  constructor(
    private account: Account,
    private inputVal: number,
    private quantity: number,
    private yearToDate: number
  ) {}

  compute(): number {
    this.importantValue1 = this.inputVal * this.quantity + this.account.delta();
    this.importantValue2 = this.inputVal * this.yearToDate + 100;
    this.adjustForYear();
    this.importantValue3 = this.importantValue2 * 7;
    return this.importantValue3 - 2 * this.importantValue1;
  }

  private adjustForYear(): void {
    if (this.yearToDate - this.importantValue1 > 100) {
      this.importantValue2 -= 20;
    }
  }
}

class Account {
  gamma(inputVal: number, quantity: number, yearToDate: number): number {
    return new GammaCalculator(this, inputVal, quantity, yearToDate).compute();
  }
}
```

### Go

```go
// BEFORE
func (a *Account) Gamma(inputVal float64, quantity int, yearToDate float64) float64 {
	importantValue1 := inputVal*float64(quantity) + a.Delta()
	importantValue2 := inputVal*yearToDate + 100
	if yearToDate-importantValue1 > 100 {
		importantValue2 -= 20
	}
	importantValue3 := importantValue2 * 7
	return importantValue3 - 2*importantValue1
}

// AFTER
type GammaCalculator struct {
	account         *Account
	inputVal        float64
	quantity        int
	yearToDate      float64
	importantValue1 float64
	importantValue2 float64
	importantValue3 float64
}

func NewGammaCalculator(account *Account, inputVal float64, quantity int, yearToDate float64) *GammaCalculator {
	return &GammaCalculator{account: account, inputVal: inputVal, quantity: quantity, yearToDate: yearToDate}
}

func (g *GammaCalculator) Compute() float64 {
	g.importantValue1 = g.inputVal*float64(g.quantity) + g.account.Delta()
	g.importantValue2 = g.inputVal*g.yearToDate + 100
	g.adjustForYear()
	g.importantValue3 = g.importantValue2 * 7
	return g.importantValue3 - 2*g.importantValue1
}

func (g *GammaCalculator) adjustForYear() {
	if g.yearToDate-g.importantValue1 > 100 {
		g.importantValue2 -= 20
	}
}

func (a *Account) Gamma(inputVal float64, quantity int, yearToDate float64) float64 {
	return NewGammaCalculator(a, inputVal, quantity, yearToDate).Compute()
}
```

### Rust

```rust
// BEFORE
impl Account {
    fn gamma(&self, input_val: f64, quantity: i32, year_to_date: f64) -> f64 {
        let important_value1 = input_val * quantity as f64 + self.delta();
        let mut important_value2 = input_val * year_to_date + 100.0;
        if year_to_date - important_value1 > 100.0 {
            important_value2 -= 20.0;
        }
        let important_value3 = important_value2 * 7.0;
        important_value3 - 2.0 * important_value1
    }
}

// AFTER
struct GammaCalculator<'a> {
    account: &'a Account,
    input_val: f64,
    quantity: i32,
    year_to_date: f64,
    important_value1: f64,
    important_value2: f64,
}

impl<'a> GammaCalculator<'a> {
    fn new(account: &'a Account, input_val: f64, quantity: i32, year_to_date: f64) -> Self {
        Self { account, input_val, quantity, year_to_date, important_value1: 0.0, important_value2: 0.0 }
    }

    fn compute(&mut self) -> f64 {
        self.important_value1 = self.input_val * self.quantity as f64 + self.account.delta();
        self.important_value2 = self.input_val * self.year_to_date + 100.0;
        self.adjust_for_year();
        let important_value3 = self.important_value2 * 7.0;
        important_value3 - 2.0 * self.important_value1
    }

    fn adjust_for_year(&mut self) {
        if self.year_to_date - self.important_value1 > 100.0 {
            self.important_value2 -= 20.0;
        }
    }
}

impl Account {
    fn gamma(&self, input_val: f64, quantity: i32, year_to_date: f64) -> f64 {
        GammaCalculator::new(self, input_val, quantity, year_to_date).compute()
    }
}
```

## Related Smells

Long Method

## Inverse

(none)
