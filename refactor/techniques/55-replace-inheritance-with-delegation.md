# Replace Inheritance with Delegation

**Category:** Dealing with Generalization
**Sources:** Shvets Ch.11

## Problem

A subclass uses only a few methods from its parent. The "is-a" relationship is wrong — it should be "has-a." The child inherits methods and fields it does not need, creating a misleading and fragile relationship.

## Motivation

Inheritance should model a genuine specialization ("is-a"). When a class inherits solely to reuse utility methods, it tightly couples to the parent's implementation details and exposes an interface it should not have. Replacing inheritance with delegation wraps the parent as a private field, forwarding only the methods that make sense. This follows the composition-over-inheritance principle.

## When to Apply

- The child uses less than half of the parent's methods
- The "is-a" test fails ("Is MyStack really an ArrayList?")
- The parent's interface leaks into the child, exposing operations that break the child's invariants
- Changes to the parent break the child unexpectedly

## Mechanics

1. Create a field in the child to hold an instance of the parent type
2. Change inherited method calls to delegate to the field
3. Remove the inheritance declaration
4. Expose only the methods the child legitimately needs
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class MyStack(list):
    """Inherits from list but only needs append/pop/len."""
    def push(self, item):
        self.append(item)

    def pop_top(self):
        return self.pop()

# Exposes: insert, remove, sort, reverse, __getitem__, __setitem__, ...

# AFTER
class MyStack:
    def __init__(self):
        self._storage: list = []

    def push(self, item):
        self._storage.append(item)

    def pop_top(self):
        return self._storage.pop()

    def size(self) -> int:
        return len(self._storage)

    def is_empty(self) -> bool:
        return len(self._storage) == 0
```

### TypeScript

```typescript
// BEFORE
class MyStack<T> extends Array<T> {
  push(...items: T[]): number { return super.push(...items); }
  popTop(): T | undefined { return this.pop(); }
}

// Exposes: splice, shift, unshift, indexOf, ...

// AFTER
class MyStack<T> {
  private storage: T[] = [];

  push(item: T): void { this.storage.push(item); }
  popTop(): T | undefined { return this.storage.pop(); }
  size(): number { return this.storage.length; }
  isEmpty(): boolean { return this.storage.length === 0; }
}
```

### Go

```go
// Go has no inheritance — composition is already the only option.
// This is how you'd naturally write it in Go.

type MyStack[T any] struct {
	storage []T // has-a slice, not is-a slice
}

func (s *MyStack[T]) Push(item T) {
	s.storage = append(s.storage, item)
}

func (s *MyStack[T]) PopTop() (T, bool) {
	if len(s.storage) == 0 {
		var zero T
		return zero, false
	}
	top := s.storage[len(s.storage)-1]
	s.storage = s.storage[:len(s.storage)-1]
	return top, true
}

func (s *MyStack[T]) Size() int     { return len(s.storage) }
func (s *MyStack[T]) IsEmpty() bool { return len(s.storage) == 0 }
```

### Rust

```rust
// Rust has no inheritance — composition is already the only option.
// This is how you'd naturally write it in Rust.

struct MyStack<T> {
    storage: Vec<T>, // has-a Vec, not is-a Vec
}

impl<T> MyStack<T> {
    fn new() -> Self {
        Self { storage: Vec::new() }
    }

    fn push(&mut self, item: T) {
        self.storage.push(item);
    }

    fn pop_top(&mut self) -> Option<T> {
        self.storage.pop()
    }

    fn size(&self) -> usize {
        self.storage.len()
    }

    fn is_empty(&self) -> bool {
        self.storage.is_empty()
    }
}
```

## Language Notes

- **Go**: Go has no inheritance at all. Composition with a private field is the only way to reuse behavior from another type. The anti-pattern this technique fixes simply cannot occur in Go.
- **Rust**: Rust has no inheritance at all. Wrapping another type as a private field is the standard approach. Rust's ownership model further reinforces composition as the natural design choice.

## Related Smells

Refused Bequest, Inappropriate Intimacy

## Inverse

(none)
