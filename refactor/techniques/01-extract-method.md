# Extract Method / Extract Function

**Category:** Composing Methods
**Sources:** Fowler Ch.6, Shvets Ch.6
**Also known as:** Extract Function

## Problem

A code fragment can be grouped together, or a function is too long and does multiple things. The intent of the code is obscured by its length and interleaved responsibilities.

## Motivation

Short, well-named functions are easier to read, reuse, and override. When you see a block of code that requires a comment to explain what it does, that comment is a signal: the block should be a function whose name replaces the comment. Extraction also eliminates duplication when the same logic appears in multiple places.

## When to Apply

- Function exceeds 10-15 lines
- A comment explains what the next block of code does
- The same logic is reused (or could be reused) elsewhere
- The function operates at multiple levels of abstraction
- You need to test a specific piece of logic in isolation

## Mechanics

1. Create a new function with a name that describes **what** it does (not **how**)
2. Copy the extracted code into the new function
3. Identify local variables used in the extracted code — they become parameters or local declarations
4. If the extracted code modifies a local variable, make it the return value
5. Replace the original code with a call to the new function
6. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def print_invoice(invoice):
    print("=" * 40)
    print("*** Customer Invoice ***")
    print("=" * 40)

    total = 0
    for item in invoice.items:
        total += item.quantity * item.price
    tax = total * 0.1
    grand_total = total + tax

    print(f"Subtotal: {total:.2f}")
    print(f"Tax:      {tax:.2f}")
    print(f"Total:    {grand_total:.2f}")

# AFTER
def print_invoice(invoice):
    print_banner()
    total, tax, grand_total = calculate_totals(invoice)
    print_details(total, tax, grand_total)

def print_banner():
    print("=" * 40)
    print("*** Customer Invoice ***")
    print("=" * 40)

def calculate_totals(invoice):
    total = sum(item.quantity * item.price for item in invoice.items)
    tax = total * 0.1
    return total, tax, total + tax

def print_details(total, tax, grand_total):
    print(f"Subtotal: {total:.2f}")
    print(f"Tax:      {tax:.2f}")
    print(f"Total:    {grand_total:.2f}")
```

### TypeScript

```typescript
// BEFORE
function printInvoice(invoice: Invoice): void {
  console.log("=".repeat(40));
  console.log("*** Customer Invoice ***");
  console.log("=".repeat(40));

  let total = 0;
  for (const item of invoice.items) {
    total += item.quantity * item.price;
  }
  const tax = total * 0.1;
  const grandTotal = total + tax;

  console.log(`Subtotal: ${total.toFixed(2)}`);
  console.log(`Tax:      ${tax.toFixed(2)}`);
  console.log(`Total:    ${grandTotal.toFixed(2)}`);
}

// AFTER
function printInvoice(invoice: Invoice): void {
  printBanner();
  const { total, tax, grandTotal } = calculateTotals(invoice);
  printDetails(total, tax, grandTotal);
}

function printBanner(): void {
  console.log("=".repeat(40));
  console.log("*** Customer Invoice ***");
  console.log("=".repeat(40));
}

function calculateTotals(invoice: Invoice) {
  const total = invoice.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const tax = total * 0.1;
  return { total, tax, grandTotal: total + tax };
}

function printDetails(total: number, tax: number, grandTotal: number): void {
  console.log(`Subtotal: ${total.toFixed(2)}`);
  console.log(`Tax:      ${tax.toFixed(2)}`);
  console.log(`Total:    ${grandTotal.toFixed(2)}`);
}
```

### Go

```go
// BEFORE
func PrintInvoice(invoice Invoice) {
	fmt.Println(strings.Repeat("=", 40))
	fmt.Println("*** Customer Invoice ***")
	fmt.Println(strings.Repeat("=", 40))

	total := 0.0
	for _, item := range invoice.Items {
		total += float64(item.Quantity) * item.Price
	}
	tax := total * 0.1
	grandTotal := total + tax

	fmt.Printf("Subtotal: %.2f\n", total)
	fmt.Printf("Tax:      %.2f\n", tax)
	fmt.Printf("Total:    %.2f\n", grandTotal)
}

// AFTER
func PrintInvoice(invoice Invoice) {
	printBanner()
	total, tax, grandTotal := calculateTotals(invoice)
	printDetails(total, tax, grandTotal)
}

func printBanner() {
	fmt.Println(strings.Repeat("=", 40))
	fmt.Println("*** Customer Invoice ***")
	fmt.Println(strings.Repeat("=", 40))
}

func calculateTotals(invoice Invoice) (float64, float64, float64) {
	total := 0.0
	for _, item := range invoice.Items {
		total += float64(item.Quantity) * item.Price
	}
	tax := total * 0.1
	return total, tax, total + tax
}

func printDetails(total, tax, grandTotal float64) {
	fmt.Printf("Subtotal: %.2f\n", total)
	fmt.Printf("Tax:      %.2f\n", tax)
	fmt.Printf("Total:    %.2f\n", grandTotal)
}
```

### Rust

```rust
// BEFORE
fn print_invoice(invoice: &Invoice) {
    println!("{}", "=".repeat(40));
    println!("*** Customer Invoice ***");
    println!("{}", "=".repeat(40));

    let total: f64 = invoice.items.iter()
        .map(|item| item.quantity as f64 * item.price)
        .sum();
    let tax = total * 0.1;
    let grand_total = total + tax;

    println!("Subtotal: {total:.2}");
    println!("Tax:      {tax:.2}");
    println!("Total:    {grand_total:.2}");
}

// AFTER
fn print_invoice(invoice: &Invoice) {
    print_banner();
    let (total, tax, grand_total) = calculate_totals(invoice);
    print_details(total, tax, grand_total);
}

fn print_banner() {
    println!("{}", "=".repeat(40));
    println!("*** Customer Invoice ***");
    println!("{}", "=".repeat(40));
}

fn calculate_totals(invoice: &Invoice) -> (f64, f64, f64) {
    let total: f64 = invoice.items.iter()
        .map(|item| item.quantity as f64 * item.price)
        .sum();
    let tax = total * 0.1;
    (total, tax, total + tax)
}

fn print_details(total: f64, tax: f64, grand_total: f64) {
    println!("Subtotal: {total:.2}");
    println!("Tax:      {tax:.2}");
    println!("Total:    {grand_total:.2}");
}
```

## Related Smells

Long Method, Duplicated Code, Comments

## Inverse

Inline Method (#02)
