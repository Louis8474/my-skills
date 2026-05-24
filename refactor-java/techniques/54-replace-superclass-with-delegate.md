# Replace Superclass with Delegate

**Category:** Dealing with Inheritance  
**Sources:** Fowler Ch.12

## Problem

A class inherits from a superclass but only uses a portion of the superclass interface, or the "is-a" relationship doesn't truly hold.

## Motivation

Classic example: a Stack that extends Vector inherits `get(i)`, `remove(i)`, and other methods that violate the Stack abstraction. When the inheritance relationship is wrong (the subclass isn't truly a specialization), replace the extends with a "has-a" delegation.

## Java 8 Example

```java
// BEFORE: Stack inherits all of Vector's methods (wrong "is-a")
class MyStack<T> extends Vector<T> {
    // Clients can call get(i), remove(i), insertElementAt(...)
    // These break the Stack contract!
    T push(T item) { addElement(item); return item; }
    T pop() { return remove(size() - 1); }
    T peek() { return get(size() - 1); }
}

// AFTER: delegation — only Stack operations exposed
class MyStack<T> {
    private final List<T> storage = new ArrayList<>();  // "has-a" instead of "is-a"

    T push(T item) { storage.add(item); return item; }

    T pop() {
        if (storage.isEmpty()) throw new EmptyStackException();
        return storage.remove(storage.size() - 1);
    }

    T peek() {
        if (storage.isEmpty()) throw new EmptyStackException();
        return storage.get(storage.size() - 1);
    }

    boolean isEmpty() { return storage.isEmpty(); }
    int size() { return storage.size(); }
}
```

## Related Smells

Refused Bequest (subclass rejects most of what it inherits)
