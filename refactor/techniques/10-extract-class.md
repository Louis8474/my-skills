# Extract Class

**Category:** Moving Features
**Sources:** Fowler Ch.7-8, Shvets Ch.7

## Problem

One class or struct does two or more things. A subset of its fields and methods form a cohesive group that represents a distinct concept, but they are buried inside a larger type that has too many responsibilities.

## Motivation

A class should have a single, well-defined responsibility. When a class grows to handle multiple concerns, it becomes harder to understand, test, and change. Extracting a cohesive cluster of fields and methods into a new type makes both the original and the new type simpler and more focused.

## When to Apply

- A subset of fields and methods form a natural, cohesive group
- The class has too many responsibilities (God Class)
- Changes to one responsibility risk breaking the other
- Two groups of fields are always used together but separately from the rest

## Mechanics

1. Identify a cohesive cluster of fields and methods
2. Create a new class/struct to hold them
3. Move the fields to the new type
4. Move the methods that operate primarily on those fields
5. Reduce the interface — remove unnecessary accessors, make things private
6. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class Person:
    def __init__(self, name: str, area_code: str, number: str):
        self.name = name
        self.area_code = area_code
        self.number = number

    def get_phone(self) -> str:
        return f"({self.area_code}) {self.number}"

# AFTER
class TelephoneNumber:
    def __init__(self, area_code: str, number: str):
        self.area_code = area_code
        self.number = number

    def __str__(self) -> str:
        return f"({self.area_code}) {self.number}"

class Person:
    def __init__(self, name: str, area_code: str, number: str):
        self.name = name
        self.phone = TelephoneNumber(area_code, number)

    def get_phone(self) -> str:
        return str(self.phone)
```

### TypeScript

```typescript
// BEFORE
class Person {
  constructor(
    public name: string,
    public areaCode: string,
    public number: string
  ) {}

  getPhone(): string {
    return `(${this.areaCode}) ${this.number}`;
  }
}

// AFTER
class TelephoneNumber {
  constructor(public areaCode: string, public number: string) {}

  toString(): string {
    return `(${this.areaCode}) ${this.number}`;
  }
}

class Person {
  public phone: TelephoneNumber;

  constructor(name: string, areaCode: string, number: string) {
    this.name = name;
    this.phone = new TelephoneNumber(areaCode, number);
  }

  name: string;

  getPhone(): string {
    return this.phone.toString();
  }
}
```

### Go

```go
// BEFORE
type Person struct {
	Name     string
	AreaCode string
	Number   string
}

func (p *Person) GetPhone() string {
	return fmt.Sprintf("(%s) %s", p.AreaCode, p.Number)
}

// AFTER
type TelephoneNumber struct {
	AreaCode string
	Number   string
}

func (t TelephoneNumber) String() string {
	return fmt.Sprintf("(%s) %s", t.AreaCode, t.Number)
}

type Person struct {
	Name  string
	Phone TelephoneNumber
}

func (p *Person) GetPhone() string {
	return p.Phone.String()
}
```

### Rust

```rust
// BEFORE
struct Person {
    name: String,
    area_code: String,
    number: String,
}

impl Person {
    fn get_phone(&self) -> String {
        format!("({}) {}", self.area_code, self.number)
    }
}

// AFTER
struct TelephoneNumber {
    area_code: String,
    number: String,
}

impl TelephoneNumber {
    fn new(area_code: String, number: String) -> Self {
        Self { area_code, number }
    }
}

impl std::fmt::Display for TelephoneNumber {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "({}) {}", self.area_code, self.number)
    }
}

struct Person {
    name: String,
    phone: TelephoneNumber,
}

impl Person {
    fn get_phone(&self) -> String {
        self.phone.to_string()
    }
}
```

## Related Smells

Large Class, Divergent Change, Data Clumps

## Inverse

Inline Class (#11)
