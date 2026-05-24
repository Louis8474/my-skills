# Substitute Algorithm

**Category:** Composing Methods
**Sources:** Fowler Ch.6, Shvets Ch.6

## Problem

An algorithm is more complex than necessary. A simpler, clearer, or more standard approach exists that produces the same result with fewer edge cases and better readability.

## Motivation

Sometimes you discover a simpler way to do something after the original code was written. The standard library may provide a built-in that replaces hand-rolled logic. Or you find that the original algorithm has subtle bugs in edge cases that a well-tested alternative avoids. When you find a clearer path, replace the entire algorithm body.

## When to Apply

- You found a clearer way to express the same logic
- The language's standard library provides an equivalent function
- The current algorithm has edge case bugs that a standard approach avoids
- You need to change the algorithm and it's easier to start fresh than patch

## Mechanics

1. Verify that comprehensive tests cover the current behavior
2. Replace the algorithm body with the simpler version
3. Run all tests thoroughly — the new algorithm must produce identical results
4. Remove any helper code that only the old algorithm needed

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def find_person(people: list[str]) -> str:
    for person in people:
        if person == "Don":
            return "Don"
        if person == "John":
            return "John"
        if person == "Kent":
            return "Kent"
    return ""

# AFTER
def find_person(people: list[str]) -> str:
    candidates = {"Don", "John", "Kent"}
    match = next((p for p in people if p in candidates), "")
    return match
```

### TypeScript

```typescript
// BEFORE
function findPerson(people: string[]): string {
  for (const person of people) {
    if (person === "Don") return "Don";
    if (person === "John") return "John";
    if (person === "Kent") return "Kent";
  }
  return "";
}

// AFTER
function findPerson(people: string[]): string {
  const candidates = new Set(["Don", "John", "Kent"]);
  return people.find((p) => candidates.has(p)) ?? "";
}
```

### Go

```go
// BEFORE
func FindPerson(people []string) string {
	for _, person := range people {
		if person == "Don" {
			return "Don"
		}
		if person == "John" {
			return "John"
		}
		if person == "Kent" {
			return "Kent"
		}
	}
	return ""
}

// AFTER
func FindPerson(people []string) string {
	candidates := map[string]bool{"Don": true, "John": true, "Kent": true}
	for _, person := range people {
		if candidates[person] {
			return person
		}
	}
	return ""
}
```

### Rust

```rust
// BEFORE
fn find_person(people: &[&str]) -> &'static str {
    for person in people {
        if *person == "Don" { return "Don"; }
        if *person == "John" { return "John"; }
        if *person == "Kent" { return "Kent"; }
    }
    ""
}

// AFTER
fn find_person(people: &[&str]) -> &'static str {
    const CANDIDATES: &[&str] = &["Don", "John", "Kent"];
    people.iter()
        .find(|p| CANDIDATES.contains(p))
        .copied()
        .unwrap_or("")
}
```

## Related Smells

Long Method

## Inverse

(none)
