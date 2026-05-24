# Replace Derived Variable with Query

**Category:** Organizing Data
**Sources:** Fowler Ch.7

## Problem

A mutable field holds a value that is derived from other data. The derived value can fall out of sync with its source whenever the source changes and the derived field is not updated. This creates subtle bugs and forces developers to remember update sequences.

## Motivation

Calculated values should be computed on demand rather than cached in mutable state. Replacing a derived variable with a query (method/property) eliminates an entire class of desynchronization bugs. The performance cost is usually negligible; if it's not, add explicit caching with invalidation rather than manual bookkeeping.

## When to Apply

- A field is updated whenever another field changes (manual sync)
- A setter updates two or more fields to keep them consistent
- You find bugs where a derived field has a stale value
- The derived value is a simple calculation from existing fields

## Mechanics

1. Identify the derived variable and the fields it depends on
2. Create a query method that computes the value from the source fields
3. Replace all reads of the derived variable with calls to the query
4. Remove the derived variable and any code that updates it
5. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class ShoppingCart:
    def __init__(self):
        self.items: list[CartItem] = []
        self.total = 0.0
        self.item_count = 0

    def add_item(self, item: CartItem):
        self.items.append(item)
        self.total += item.price * item.quantity      # manual sync
        self.item_count += item.quantity               # manual sync

    def remove_item(self, index: int):
        item = self.items.pop(index)
        self.total -= item.price * item.quantity       # easy to forget
        self.item_count -= item.quantity                # easy to forget

# AFTER
class ShoppingCart:
    def __init__(self):
        self.items: list[CartItem] = []

    def add_item(self, item: CartItem):
        self.items.append(item)

    def remove_item(self, index: int):
        self.items.pop(index)

    @property
    def total(self) -> float:
        return sum(item.price * item.quantity for item in self.items)

    @property
    def item_count(self) -> int:
        return sum(item.quantity for item in self.items)
```

### TypeScript

```typescript
// BEFORE
class ShoppingCart {
  items: CartItem[] = [];
  total = 0;
  itemCount = 0;

  addItem(item: CartItem): void {
    this.items.push(item);
    this.total += item.price * item.quantity;
    this.itemCount += item.quantity;
  }

  removeItem(index: number): void {
    const item = this.items.splice(index, 1)[0];
    this.total -= item.price * item.quantity;
    this.itemCount -= item.quantity;
  }
}

// AFTER
class ShoppingCart {
  items: CartItem[] = [];

  addItem(item: CartItem): void {
    this.items.push(item);
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
  }

  get total(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get itemCount(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
```

### Go

```go
// BEFORE
type ShoppingCart struct {
	Items     []CartItem
	Total     float64
	ItemCount int
}

func (c *ShoppingCart) AddItem(item CartItem) {
	c.Items = append(c.Items, item)
	c.Total += item.Price * float64(item.Quantity)
	c.ItemCount += item.Quantity
}

func (c *ShoppingCart) RemoveItem(index int) {
	item := c.Items[index]
	c.Items = append(c.Items[:index], c.Items[index+1:]...)
	c.Total -= item.Price * float64(item.Quantity)
	c.ItemCount -= item.Quantity
}

// AFTER
type ShoppingCart struct {
	Items []CartItem
}

func (c *ShoppingCart) AddItem(item CartItem) {
	c.Items = append(c.Items, item)
}

func (c *ShoppingCart) RemoveItem(index int) {
	c.Items = append(c.Items[:index], c.Items[index+1:]...)
}

func (c *ShoppingCart) Total() float64 {
	total := 0.0
	for _, item := range c.Items {
		total += item.Price * float64(item.Quantity)
	}
	return total
}

func (c *ShoppingCart) ItemCount() int {
	count := 0
	for _, item := range c.Items {
		count += item.Quantity
	}
	return count
}
```

### Rust

```rust
// BEFORE
struct ShoppingCart {
    items: Vec<CartItem>,
    total: f64,
    item_count: usize,
}

impl ShoppingCart {
    fn add_item(&mut self, item: CartItem) {
        self.total += item.price * item.quantity as f64;
        self.item_count += item.quantity;
        self.items.push(item);
    }

    fn remove_item(&mut self, index: usize) {
        let item = self.items.remove(index);
        self.total -= item.price * item.quantity as f64;
        self.item_count -= item.quantity;
    }
}

// AFTER
struct ShoppingCart {
    items: Vec<CartItem>,
}

impl ShoppingCart {
    fn add_item(&mut self, item: CartItem) {
        self.items.push(item);
    }

    fn remove_item(&mut self, index: usize) {
        self.items.remove(index);
    }

    fn total(&self) -> f64 {
        self.items.iter().map(|item| item.price * item.quantity as f64).sum()
    }

    fn item_count(&self) -> usize {
        self.items.iter().map(|item| item.quantity).sum()
    }
}
```

## Related Smells

Mutable Data, Duplicated Code

## Inverse

(none)
