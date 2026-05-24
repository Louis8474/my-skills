# Inline Class

**Category:** Moving Features
**Sources:** Fowler Ch.7-8, Shvets Ch.7

## Problem

A class or struct is too small to justify its existence. It has barely any behavior — perhaps just one or two fields with no meaningful methods. The abstraction overhead exceeds its value.

## Motivation

Extract Class's inverse. Sometimes after refactoring, a class shrinks until it no longer pulls its weight. Or the class was over-extracted from the start. When a type does almost nothing, fold it back into the consuming type to reduce indirection and simplify the codebase.

## When to Apply

- The class has barely any behavior or responsibility
- It was over-extracted and adds indirection without value
- Only one consumer uses this class
- You want to redistribute responsibilities and will re-extract differently afterward

## Mechanics

1. Move all fields and methods from the source type into the absorbing type
2. Update all references
3. Remove the now-empty source type
4. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class TelephoneNumber:
    def __init__(self, area_code: str, number: str):
        self.area_code = area_code
        self.number = number

class Person:
    def __init__(self, name: str, phone: TelephoneNumber):
        self.name = name
        self.phone = phone

    def get_area_code(self) -> str:
        return self.phone.area_code

    def get_number(self) -> str:
        return self.phone.number

# AFTER
class Person:
    def __init__(self, name: str, area_code: str, number: str):
        self.name = name
        self.area_code = area_code
        self.number = number

    def get_area_code(self) -> str:
        return self.area_code

    def get_number(self) -> str:
        return self.number
```

### TypeScript

```typescript
// BEFORE
class TelephoneNumber {
  constructor(public areaCode: string, public number: string) {}
}

class Person {
  constructor(public name: string, private phone: TelephoneNumber) {}

  getAreaCode(): string {
    return this.phone.areaCode;
  }

  getNumber(): string {
    return this.phone.number;
  }
}

// AFTER
class Person {
  constructor(
    public name: string,
    public areaCode: string,
    public number: string
  ) {}

  getAreaCode(): string {
    return this.areaCode;
  }

  getNumber(): string {
    return this.number;
  }
}
```

### Go

```go
// BEFORE
type TelephoneNumber struct {
	AreaCode string
	Number   string
}

type Person struct {
	Name  string
	Phone TelephoneNumber
}

func (p *Person) GetAreaCode() string { return p.Phone.AreaCode }
func (p *Person) GetNumber() string   { return p.Phone.Number }

// AFTER
type Person struct {
	Name     string
	AreaCode string
	Number   string
}

func (p *Person) GetAreaCode() string { return p.AreaCode }
func (p *Person) GetNumber() string   { return p.Number }
```

### Rust

```rust
// BEFORE
struct TelephoneNumber {
    area_code: String,
    number: String,
}

struct Person {
    name: String,
    phone: TelephoneNumber,
}

impl Person {
    fn area_code(&self) -> &str { &self.phone.area_code }
    fn number(&self) -> &str { &self.phone.number }
}

// AFTER
struct Person {
    name: String,
    area_code: String,
    number: String,
}

impl Person {
    fn area_code(&self) -> &str { &self.area_code }
    fn number(&self) -> &str { &self.number }
}
```

## Related Smells

Lazy Class/Element

## Inverse

Extract Class (#10)
