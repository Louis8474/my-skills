# Replace Control Flag with Break/Return

**Category:** Simplifying Conditionals
**Sources:** Shvets Ch.9

## Problem

A boolean flag variable controls loop exit or branch selection. The flag obscures the actual control flow: instead of seeing a `break` or `return` that clearly exits, the reader must track the flag's state through the loop to understand when and why execution stops.

## Motivation

Direct control flow statements (`break`, `return`, `continue`) express intent immediately. A `break` means "we're done" — there's no ambiguity. Flags force the reader to hold state in their head, scanning for where the flag is set and where it's checked. Removing the flag makes the logic linear and obvious.

## When to Apply

- A boolean variable is used solely to control loop exit (`done`, `found`, `stop`)
- The flag is checked in the loop condition or in an if-statement inside the loop
- The flag is set once and never reset — a one-way signal
- The loop could use `break`, `return`, or `continue` instead

## Mechanics

1. Find where the flag is set to its terminating value
2. Replace the flag assignment with `break`, `return`, or `continue`
3. Remove the flag variable declaration and its checks
4. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def find_suspect(people: list[Person]) -> str:
    found = False
    suspect = ""
    for person in people:
        if not found:
            if person.name == "Don":
                suspect = "Don"
                found = True
            elif person.name == "John":
                suspect = "John"
                found = True
    return suspect

# AFTER
def find_suspect(people: list[Person]) -> str:
    for person in people:
        if person.name in ("Don", "John"):
            return person.name
    return ""
```

### TypeScript

```typescript
// BEFORE
function findSuspect(people: Person[]): string {
  let found = false;
  let suspect = "";
  for (const person of people) {
    if (!found) {
      if (person.name === "Don" || person.name === "John") {
        suspect = person.name;
        found = true;
      }
    }
  }
  return suspect;
}

// AFTER
function findSuspect(people: Person[]): string {
  for (const person of people) {
    if (person.name === "Don" || person.name === "John") {
      return person.name;
    }
  }
  return "";
}
```

### Go

```go
// BEFORE
func findSuspect(people []Person) string {
	found := false
	suspect := ""
	for _, person := range people {
		if !found {
			if person.Name == "Don" || person.Name == "John" {
				suspect = person.Name
				found = true
			}
		}
	}
	return suspect
}

// AFTER
func findSuspect(people []Person) string {
	for _, person := range people {
		if person.Name == "Don" || person.Name == "John" {
			return person.Name
		}
	}
	return ""
}
```

### Rust

```rust
// BEFORE
fn find_suspect(people: &[Person]) -> String {
    let mut found = false;
    let mut suspect = String::new();
    for person in people {
        if !found {
            if person.name == "Don" || person.name == "John" {
                suspect = person.name.clone();
                found = true;
            }
        }
    }
    suspect
}

// AFTER
fn find_suspect(people: &[Person]) -> Option<&str> {
    for person in people {
        if person.name == "Don" || person.name == "John" {
            return Some(&person.name);
        }
    }
    None
}

// Alternative: idiomatic iterator
fn find_suspect_iter(people: &[Person]) -> Option<&str> {
    people
        .iter()
        .find(|p| p.name == "Don" || p.name == "John")
        .map(|p| p.name.as_str())
}
```

## Related Smells

Long Method, Mysterious Name

## Inverse

(none)
