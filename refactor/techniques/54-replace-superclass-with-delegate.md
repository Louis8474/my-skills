# Replace Superclass with Delegate

**Category:** Dealing with Generalization
**Sources:** Fowler Ch.12

## Problem

A subclass inherits from a parent but does not need most of the parent's interface. The child uses the parent as a utility bag rather than representing a true "is-a" relationship, violating the Liskov Substitution Principle.

## Motivation

When a class inherits from another solely to reuse a few of its methods — not because it truly is a specialization — the inheritance exposes the full parent interface to clients. A Stack that extends List lets callers insert at arbitrary positions, breaking the Stack abstraction. Replacing inheritance with delegation (has-a) hides the parent's interface and exposes only the methods the child legitimately needs.

## When to Apply

- The child does not satisfy "is-a" — it is not a valid substitute for the parent
- The child exposes parent methods that violate its own invariants
- Clients of the child can call inherited methods that don't make sense
- The relationship is "uses" or "has-a," not "is-a"

## Mechanics

1. Create a field in the child that holds an instance of the parent
2. Forward the methods the child actually needs to the delegate
3. Remove the inheritance relationship
4. Test that the child no longer exposes unwanted parent methods

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Stack(list):
    def push(self, item):
        self.append(item)

    def pop_top(self):
        return self.pop()

    def peek(self):
        return self[-1]

# Problem: Stack exposes insert(), __setitem__(), extend(), etc.

# AFTER
class Stack:
    def __init__(self):
        self._items: list = []

    def push(self, item):
        self._items.append(item)

    def pop_top(self):
        return self._items.pop()

    def peek(self):
        return self._items[-1]

    def is_empty(self) -> bool:
        return len(self._items) == 0

    def __len__(self) -> int:
        return len(self._items)
```

### TypeScript

```typescript
// BEFORE
class Stack<T> extends Array<T> {
  push(...items: T[]): number { return super.push(...items); }
  popTop(): T | undefined { return this.pop(); }
  peek(): T | undefined { return this[this.length - 1]; }
}

// Problem: Stack exposes splice(), shift(), indexOf(), etc.

// AFTER
class Stack<T> {
  private items: T[] = [];

  push(item: T): void { this.items.push(item); }
  popTop(): T | undefined { return this.items.pop(); }
  peek(): T | undefined { return this.items[this.items.length - 1]; }
  isEmpty(): boolean { return this.items.length === 0; }
  get size(): number { return this.items.length; }
}
```

### Go

```go
// Go has no inheritance — composition is already the default.
// This is how you'd naturally write a Stack in Go.

type Stack[T any] struct {
	items []T
}

func (s *Stack[T]) Push(item T) {
	s.items = append(s.items, item)
}

func (s *Stack[T]) Pop() (T, bool) {
	if len(s.items) == 0 {
		var zero T
		return zero, false
	}
	top := s.items[len(s.items)-1]
	s.items = s.items[:len(s.items)-1]
	return top, true
}

func (s *Stack[T]) Peek() (T, bool) {
	if len(s.items) == 0 {
		var zero T
		return zero, false
	}
	return s.items[len(s.items)-1], true
}

func (s *Stack[T]) IsEmpty() bool { return len(s.items) == 0 }
func (s *Stack[T]) Size() int     { return len(s.items) }
```

### Rust

```rust
// Rust has no inheritance — composition is already the default.
// This is how you'd naturally write a Stack in Rust.

struct Stack<T> {
    items: Vec<T>,
}

impl<T> Stack<T> {
    fn new() -> Self {
        Self { items: Vec::new() }
    }

    fn push(&mut self, item: T) {
        self.items.push(item);
    }

    fn pop(&mut self) -> Option<T> {
        self.items.pop()
    }

    fn peek(&self) -> Option<&T> {
        self.items.last()
    }

    fn is_empty(&self) -> bool {
        self.items.is_empty()
    }

    fn size(&self) -> usize {
        self.items.len()
    }
}
```

## Language Notes

- **Go**: Go has no inheritance, so this anti-pattern cannot occur. Composition (struct containing a `[]T` field) is the only option, which is exactly the correct approach. The example shows idiomatic Go.
- **Rust**: Rust has no inheritance, so this anti-pattern cannot occur. Wrapping a `Vec<T>` inside a struct and exposing only the desired methods is the standard approach.

## Related Smells

Refused Bequest

## Inverse

(none)
