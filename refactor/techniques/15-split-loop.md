# Split Loop

**Category:** Moving Features
**Sources:** Fowler Ch.8

## Problem

A single loop does multiple unrelated things — it calculates a sum, finds a maximum, and builds a list all at once. This makes the loop hard to understand and impossible to extract individual responsibilities into their own functions.

## Motivation

A loop that does two things is harder to understand than two loops that each do one thing. Yes, this means iterating twice, but clarity almost always trumps micro-optimization. Once each loop has a single responsibility, you can easily extract each one into a well-named function. Profile before worrying about the performance cost — in most cases it is negligible.

## When to Apply

- A loop calculates multiple unrelated values (e.g., sum AND maximum)
- A loop has multiple independent responsibilities
- You want to extract loop bodies into named functions but can't because they are interleaved
- The loop is hard to read because it juggles too many concerns

## Mechanics

1. Duplicate the loop
2. Remove the code for one concern from each copy, so each loop does only one thing
3. Test — the results must be identical
4. (Optional) Extract each loop into a well-named function

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def report(employees):
    youngest_age = float("inf")
    total_salary = 0
    for emp in employees:
        total_salary += emp.salary
        if emp.age < youngest_age:
            youngest_age = emp.age
    print(f"Youngest: {youngest_age}")
    print(f"Total salary: {total_salary}")

# AFTER
def report(employees):
    total_salary = sum(emp.salary for emp in employees)
    youngest_age = min(emp.age for emp in employees)
    print(f"Youngest: {youngest_age}")
    print(f"Total salary: {total_salary}")
```

### TypeScript

```typescript
// BEFORE
function report(employees: Employee[]): void {
  let youngestAge = Infinity;
  let totalSalary = 0;
  for (const emp of employees) {
    totalSalary += emp.salary;
    if (emp.age < youngestAge) {
      youngestAge = emp.age;
    }
  }
  console.log(`Youngest: ${youngestAge}`);
  console.log(`Total salary: ${totalSalary}`);
}

// AFTER
function report(employees: Employee[]): void {
  const totalSalary = employees.reduce((sum, emp) => sum + emp.salary, 0);
  const youngestAge = Math.min(...employees.map((emp) => emp.age));
  console.log(`Youngest: ${youngestAge}`);
  console.log(`Total salary: ${totalSalary}`);
}
```

### Go

```go
// BEFORE
func Report(employees []Employee) {
	youngestAge := math.MaxInt
	totalSalary := 0.0
	for _, emp := range employees {
		totalSalary += emp.Salary
		if emp.Age < youngestAge {
			youngestAge = emp.Age
		}
	}
	fmt.Printf("Youngest: %d\n", youngestAge)
	fmt.Printf("Total salary: %.2f\n", totalSalary)
}

// AFTER
func Report(employees []Employee) {
	totalSalary := totalSalary(employees)
	youngestAge := youngestAge(employees)
	fmt.Printf("Youngest: %d\n", youngestAge)
	fmt.Printf("Total salary: %.2f\n", totalSalary)
}

func totalSalary(employees []Employee) float64 {
	total := 0.0
	for _, emp := range employees {
		total += emp.Salary
	}
	return total
}

func youngestAge(employees []Employee) int {
	youngest := math.MaxInt
	for _, emp := range employees {
		if emp.Age < youngest {
			youngest = emp.Age
		}
	}
	return youngest
}
```

### Rust

```rust
// BEFORE
fn report(employees: &[Employee]) {
    let mut youngest_age = i32::MAX;
    let mut total_salary = 0.0;
    for emp in employees {
        total_salary += emp.salary;
        if emp.age < youngest_age {
            youngest_age = emp.age;
        }
    }
    println!("Youngest: {youngest_age}");
    println!("Total salary: {total_salary:.2}");
}

// AFTER
fn report(employees: &[Employee]) {
    let total_salary: f64 = employees.iter().map(|e| e.salary).sum();
    let youngest_age = employees.iter().map(|e| e.age).min().unwrap_or(0);
    println!("Youngest: {youngest_age}");
    println!("Total salary: {total_salary:.2}");
}
```

## Related Smells

Long Method

## Inverse

(none)
