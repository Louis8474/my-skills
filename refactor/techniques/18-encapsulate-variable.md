# Encapsulate Variable / Self-Encapsulate Field

**Category:** Organizing Data
**Sources:** Fowler Ch.7
**Also known as:** Self-Encapsulate Field

## Problem

Data is accessed directly, especially data with wide scope (globals, public fields). Direct access makes it hard to monitor changes, add validation, or introduce side effects like logging later. Any part of the system can read or modify the data without going through a controlled gateway.

## Motivation

Encapsulation provides a clear point of access for data. By routing all access through getter/setter functions (or properties), you gain a single place to add validation, logging, caching, or access control. This is especially important for mutable data — you can monitor who changes it and enforce invariants. For data that moves between contexts, encapsulation gives you a clear interception point.

## When to Apply

- Public or global mutable data is accessed from many places
- You want to add validation or logging when data changes
- You need to control who can read or modify a value
- You plan to replace a simple value with a computed one later

## Mechanics

1. Create getter and setter functions (or language-appropriate equivalents like properties)
2. Replace all direct reads with the getter
3. Replace all direct writes with the setter
4. Restrict visibility of the raw data (make it private)
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
default_owner = {"first_name": "Martin", "last_name": "Fowler"}

# Client code:
# owner = default_owner
# default_owner = {"first_name": "Kent", "last_name": "Beck"}

# AFTER
class _DefaultOwner:
    def __init__(self):
        self._owner = {"first_name": "Martin", "last_name": "Fowler"}

    @property
    def default_owner(self) -> dict:
        return dict(self._owner)  # return a copy

    @default_owner.setter
    def default_owner(self, value: dict):
        self._owner = {"first_name": value["first_name"], "last_name": value["last_name"]}

_owner_data = _DefaultOwner()

def get_default_owner() -> dict:
    return _owner_data.default_owner

def set_default_owner(value: dict):
    _owner_data.default_owner = value

# Client code:
# owner = get_default_owner()
# set_default_owner({"first_name": "Kent", "last_name": "Beck"})
```

### TypeScript

```typescript
// BEFORE
export let defaultOwner = { firstName: "Martin", lastName: "Fowler" };

// Client code:
// const owner = defaultOwner;
// defaultOwner = { firstName: "Kent", lastName: "Beck" };

// AFTER
let _defaultOwner = { firstName: "Martin", lastName: "Fowler" };

export function getDefaultOwner(): { firstName: string; lastName: string } {
  return { ..._defaultOwner };
}

export function setDefaultOwner(value: { firstName: string; lastName: string }): void {
  _defaultOwner = { firstName: value.firstName, lastName: value.lastName };
}

// Client code:
// const owner = getDefaultOwner();
// setDefaultOwner({ firstName: "Kent", lastName: "Beck" });
```

### Go

```go
// BEFORE
var DefaultOwner = Owner{FirstName: "Martin", LastName: "Fowler"}

// Client code:
// owner := DefaultOwner
// DefaultOwner = Owner{FirstName: "Kent", LastName: "Beck"}

// AFTER
type Owner struct {
	FirstName string
	LastName  string
}

var defaultOwner = Owner{FirstName: "Martin", LastName: "Fowler"}

func GetDefaultOwner() Owner {
	return defaultOwner // Go copies structs by value
}

func SetDefaultOwner(o Owner) {
	defaultOwner = o
}

// Client code:
// owner := GetDefaultOwner()
// SetDefaultOwner(Owner{FirstName: "Kent", LastName: "Beck"})
```

### Rust

```rust
// BEFORE — public static mutable (unsafe, avoid)
// pub static mut DEFAULT_OWNER: Owner = Owner { first_name: "Martin", last_name: "Fowler" };

// AFTER — encapsulated with interior mutability
use std::sync::RwLock;

struct Owner {
    first_name: String,
    last_name: String,
}

static DEFAULT_OWNER: RwLock<Owner> = RwLock::new(Owner {
    first_name: String::new(),
    last_name: String::new(),
});

fn get_default_owner() -> (String, String) {
    let owner = DEFAULT_OWNER.read().unwrap();
    (owner.first_name.clone(), owner.last_name.clone())
}

fn set_default_owner(first_name: String, last_name: String) {
    let mut owner = DEFAULT_OWNER.write().unwrap();
    owner.first_name = first_name;
    owner.last_name = last_name;
}

// Client code:
// let (first, last) = get_default_owner();
// set_default_owner("Kent".into(), "Beck".into());
```

## Related Smells

Global Data, Mutable Data

## Inverse

(none)
