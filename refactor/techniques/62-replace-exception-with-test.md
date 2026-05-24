# Replace Exception with Test / Replace Exception with Precheck

**Category:** Additional Techniques
**Sources:** Shvets Ch.10
**Also known as:** Replace Exception with Precheck, Replace Exception with Conditional

## Problem

An exception is used for control flow — catching expected conditions instead of checking for them first. The try/catch handles a situation that is not truly exceptional (like checking array bounds or null values), making the code slower, harder to read, and masking real errors.

## Motivation

Exceptions should signal unexpected failures, not expected conditions. When a condition is predictable and testable, checking it before the operation is clearer, faster, and does not abuse the exception mechanism. The precheck makes the code's intent explicit: "I know this might not work, so I check first" rather than "I'll try and catch the failure."

## When to Apply

- The exception is expected in normal operation, not truly exceptional
- The condition can be tested before the operation
- The catch block handles a "normal" control flow case
- Performance matters and the exception path is hot
- The try/catch obscures the logic

## Mechanics

1. Identify the condition that triggers the exception
2. Add a test (if/guard) that checks the condition before the operation
3. Move the catch-block logic into the else/guard branch
4. Remove the try/catch
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE — exception as control flow
def get_value(collection: list, index: int) -> str:
    try:
        return collection[index]
    except IndexError:
        return "default"

def find_user(users: dict, user_id: str) -> str:
    try:
        return users[user_id]
    except KeyError:
        return "unknown"

# AFTER — precheck
def get_value(collection: list, index: int) -> str:
    if 0 <= index < len(collection):
        return collection[index]
    return "default"

def find_user(users: dict, user_id: str) -> str:
    if user_id in users:
        return users[user_id]
    return "unknown"
```

### TypeScript

```typescript
// BEFORE — exception as control flow
function parseConfig(raw: string): Config {
  try {
    return JSON.parse(raw) as Config;
  } catch {
    return defaultConfig();
  }
}

function getElement(arr: number[], index: number): number {
  try {
    if (index < 0 || index >= arr.length) throw new Error();
    return arr[index];
  } catch {
    return 0;
  }
}

// AFTER — precheck
function parseConfig(raw: string): Config {
  if (!raw || raw.trim().length === 0) {
    return defaultConfig();
  }
  try {
    return JSON.parse(raw) as Config;
  } catch {
    return defaultConfig(); // JSON.parse failure is genuinely exceptional
  }
}

function getElement(arr: number[], index: number): number {
  if (index >= 0 && index < arr.length) {
    return arr[index];
  }
  return 0;
}
```

### Go

```go
// Go already uses check-before-call by design — no exceptions exist.
// The idiomatic approach is to test conditions before operating.

// BEFORE — simulating exception-style with panic/recover (anti-pattern)
func GetValue(items []string, index int) string {
	defer func() { recover() }()
	return items[index] // panics on out-of-bounds
}

// AFTER — idiomatic Go precheck
func GetValue(items []string, index int) string {
	if index < 0 || index >= len(items) {
		return "default"
	}
	return items[index]
}

// Map lookup with comma-ok idiom
func FindUser(users map[string]string, userID string) string {
	if name, ok := users[userID]; ok {
		return name
	}
	return "unknown"
}
```

### Rust

```rust
// Rust already uses check-before-call by design — no exceptions exist.
// The idiomatic approach uses Option/Result and pattern matching.

// BEFORE — using unwrap (panics on failure, similar to uncaught exception)
fn get_value(items: &[String], index: usize) -> String {
    items[index].clone() // panics on out-of-bounds
}

// AFTER — idiomatic Rust precheck
fn get_value(items: &[String], index: usize) -> String {
    items.get(index)
        .cloned()
        .unwrap_or_else(|| "default".to_string())
}

// Map lookup with Option
fn find_user(users: &std::collections::HashMap<String, String>, user_id: &str) -> String {
    users.get(user_id)
        .cloned()
        .unwrap_or_else(|| "unknown".to_string())
}
```

## Language Notes

- **Go**: Go has no exceptions. The `panic`/`recover` mechanism exists but is reserved for truly unrecoverable situations. Idiomatic Go uses prechecks, comma-ok patterns (`val, ok := map[key]`), and error returns. This technique is already the default Go approach.
- **Rust**: Rust has no exceptions. `panic!` is for unrecoverable errors. Idiomatic Rust uses `Option<T>` for nullable values and `Result<T, E>` for operations that can fail. Methods like `.get()` return `Option` instead of panicking, and combinators like `.unwrap_or_else()` provide clean default handling.

## Related Smells

(performance, clarity, control flow abuse)

## Inverse

Replace Error Code with Exception (#61)
