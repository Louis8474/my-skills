# Replace Error Code with Exception / Proper Error Handling

**Category:** Additional Techniques
**Sources:** Shvets Ch.10

## Problem

A function returns a special value (-1, null, 0, or a magic number) to signal failure. The caller must remember to check the return value against the magic value, and forgetting to check leads to silent bugs — the error propagates as garbage data.

## Motivation

Error codes are easy to ignore. An exception (or a typed error/Result) forces the caller to handle the failure case explicitly. The error path becomes visible in the code structure rather than hidden behind a magic return value. In languages with exception handling, exceptions separate the happy path from error handling. In languages with typed error returns (Go, Rust), the compiler enforces that errors are handled.

## When to Apply

- A function returns -1, null, or a sentinel value to indicate failure
- Callers frequently forget to check the error condition
- The error case requires a different control flow from the success case
- You want the compiler or type system to enforce error handling

## Mechanics

1. Replace the magic return value with an exception, error return, or Result type
2. Update all callers to handle the error explicitly
3. Define custom error types if different failure modes need different handling
4. Test both success and failure paths

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Account:
    def __init__(self, balance: float):
        self.balance = balance

    def withdraw(self, amount: float) -> float:
        if amount > self.balance:
            return -1  # magic error code
        self.balance -= amount
        return self.balance

# Caller must remember to check for -1
result = account.withdraw(500)
if result == -1:
    print("Insufficient funds")

# AFTER
class InsufficientFundsError(Exception):
    def __init__(self, balance: float, amount: float):
        self.balance = balance
        self.amount = amount
        super().__init__(f"Cannot withdraw {amount}: balance is {balance}")

class Account:
    def __init__(self, balance: float):
        self.balance = balance

    def withdraw(self, amount: float) -> float:
        if amount > self.balance:
            raise InsufficientFundsError(self.balance, amount)
        self.balance -= amount
        return self.balance

# Caller is forced to handle the error
try:
    result = account.withdraw(500)
except InsufficientFundsError as e:
    print(f"Cannot withdraw: {e}")
```

### TypeScript

```typescript
// BEFORE
class Account {
  constructor(private balance: number) {}

  withdraw(amount: number): number {
    if (amount > this.balance) return -1; // magic error code
    this.balance -= amount;
    return this.balance;
  }
}

// AFTER
class InsufficientFundsError extends Error {
  constructor(public balance: number, public amount: number) {
    super(`Cannot withdraw ${amount}: balance is ${balance}`);
    this.name = "InsufficientFundsError";
  }
}

class Account {
  constructor(private balance: number) {}

  withdraw(amount: number): number {
    if (amount > this.balance) {
      throw new InsufficientFundsError(this.balance, amount);
    }
    this.balance -= amount;
    return this.balance;
  }
}

// Caller is forced to handle the error
try {
  const result = account.withdraw(500);
} catch (e) {
  if (e instanceof InsufficientFundsError) {
    console.log(`Insufficient funds: have ${e.balance}, need ${e.amount}`);
  }
}
```

### Go

```go
// Go already uses error returns — the fix is replacing magic values
// with proper custom error types.

// BEFORE — magic return value
func (a *Account) Withdraw(amount float64) float64 {
	if amount > a.Balance {
		return -1 // magic error code, easy to ignore
	}
	a.Balance -= amount
	return a.Balance
}

// AFTER — proper error type
type InsufficientFundsError struct {
	Balance float64
	Amount  float64
}

func (e *InsufficientFundsError) Error() string {
	return fmt.Sprintf("cannot withdraw %.2f: balance is %.2f", e.Amount, e.Balance)
}

func (a *Account) Withdraw(amount float64) (float64, error) {
	if amount > a.Balance {
		return 0, &InsufficientFundsError{Balance: a.Balance, Amount: amount}
	}
	a.Balance -= amount
	return a.Balance, nil
}

// Caller — compiler warns if error is ignored
balance, err := account.Withdraw(500)
if err != nil {
	var insErr *InsufficientFundsError
	if errors.As(err, &insErr) {
		fmt.Printf("Need %.2f more\n", insErr.Amount-insErr.Balance)
	}
}
```

### Rust

```rust
// Rust already uses Result<T, E> — the fix is replacing magic values
// with proper custom error types.

// BEFORE — magic return value
impl Account {
    fn withdraw(&mut self, amount: f64) -> f64 {
        if amount > self.balance {
            return -1.0; // magic error code
        }
        self.balance -= amount;
        self.balance
    }
}

// AFTER — proper Result with custom error
#[derive(Debug)]
enum AccountError {
    InsufficientFunds { balance: f64, amount: f64 },
}

impl std::fmt::Display for AccountError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::InsufficientFunds { balance, amount } =>
                write!(f, "cannot withdraw {amount}: balance is {balance}"),
        }
    }
}

impl std::error::Error for AccountError {}

struct Account { balance: f64 }

impl Account {
    fn withdraw(&mut self, amount: f64) -> Result<f64, AccountError> {
        if amount > self.balance {
            return Err(AccountError::InsufficientFunds {
                balance: self.balance,
                amount,
            });
        }
        self.balance -= amount;
        Ok(self.balance)
    }
}

// Caller — compiler enforces handling the Result
match account.withdraw(500.0) {
    Ok(balance) => println!("New balance: {balance}"),
    Err(AccountError::InsufficientFunds { balance, amount }) =>
        println!("Need {:.2} more", amount - balance),
}
```

## Related Smells

(error handling, silent failures)

## Inverse

Replace Exception with Test (#62)
