# Split Variable / Remove Assignments to Parameters

**Category:** Organizing Data
**Sources:** Fowler Ch.6-7, Shvets Ch.7
**Also known as:** Remove Assignments to Parameters, Split Temp

## Problem

A variable is assigned multiple times for different purposes. Each assignment represents a different concept, but they share a name, making the code confusing and error-prone. Readers must track which "version" of the variable is active at each point.

## Motivation

Each variable should have exactly one responsibility. When a temp is reused for unrelated calculations, renaming it to reflect each purpose makes the code self-documenting. This also makes it easier to extract methods later, since each variable's scope and lifetime become clear.

## When to Apply

- A temporary variable is assigned in multiple places for different meanings
- A loop accumulator is also reused as the final result holder
- A parameter is reassigned inside the function body
- You see a variable used for two unrelated calculations in sequence

## Mechanics

1. Identify each distinct purpose the variable serves
2. Create a new variable for each purpose with a descriptive name
3. Replace each assignment and its subsequent uses with the new variable
4. Declare each new variable as close to its first use as possible
5. Make variables immutable where the language supports it (`const`, `let`, `val`)
6. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def calculate_dimensions(height: float, width: float) -> None:
    temp = 2 * (height + width)
    print(f"Perimeter: {temp}")

    temp = height * width
    print(f"Area: {temp}")

    temp = (height**2 + width**2) ** 0.5
    print(f"Diagonal: {temp}")

# AFTER
def calculate_dimensions(height: float, width: float) -> None:
    perimeter = 2 * (height + width)
    print(f"Perimeter: {perimeter}")

    area = height * width
    print(f"Area: {area}")

    diagonal = (height**2 + width**2) ** 0.5
    print(f"Diagonal: {diagonal}")
```

### TypeScript

```typescript
// BEFORE
function calculateDimensions(height: number, width: number): void {
  let temp = 2 * (height + width);
  console.log(`Perimeter: ${temp}`);

  temp = height * width;
  console.log(`Area: ${temp}`);

  temp = Math.sqrt(height ** 2 + width ** 2);
  console.log(`Diagonal: ${temp}`);
}

// AFTER
function calculateDimensions(height: number, width: number): void {
  const perimeter = 2 * (height + width);
  console.log(`Perimeter: ${perimeter}`);

  const area = height * width;
  console.log(`Area: ${area}`);

  const diagonal = Math.sqrt(height ** 2 + width ** 2);
  console.log(`Diagonal: ${diagonal}`);
}
```

### Go

```go
// BEFORE
func calculateDimensions(height, width float64) {
	temp := 2 * (height + width)
	fmt.Printf("Perimeter: %.2f\n", temp)

	temp = height * width
	fmt.Printf("Area: %.2f\n", temp)

	temp = math.Sqrt(height*height + width*width)
	fmt.Printf("Diagonal: %.2f\n", temp)
}

// AFTER
func calculateDimensions(height, width float64) {
	perimeter := 2 * (height + width)
	fmt.Printf("Perimeter: %.2f\n", perimeter)

	area := height * width
	fmt.Printf("Area: %.2f\n", area)

	diagonal := math.Sqrt(height*height + width*width)
	fmt.Printf("Diagonal: %.2f\n", diagonal)
}
```

### Rust

```rust
// BEFORE
fn calculate_dimensions(height: f64, width: f64) {
    let mut temp = 2.0 * (height + width);
    println!("Perimeter: {temp:.2}");

    temp = height * width;
    println!("Area: {temp:.2}");

    temp = (height.powi(2) + width.powi(2)).sqrt();
    println!("Diagonal: {temp:.2}");
}

// AFTER
fn calculate_dimensions(height: f64, width: f64) {
    let perimeter = 2.0 * (height + width);
    println!("Perimeter: {perimeter:.2}");

    let area = height * width;
    println!("Area: {area:.2}");

    let diagonal = (height.powi(2) + width.powi(2)).sqrt();
    println!("Diagonal: {diagonal:.2}");
}
```

## Related Smells

Long Method, Mysterious Name

## Inverse

(none)
