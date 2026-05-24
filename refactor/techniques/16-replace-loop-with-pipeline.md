# Replace Loop with Pipeline

**Category:** Moving Features
**Sources:** Fowler Ch.8

## Problem

An imperative loop with interleaved filtering, transforming, and collecting obscures intent. The reader must trace through the loop body to understand what it actually produces, mentally separating the "what" from the "how."

## Motivation

Collection pipelines (map, filter, reduce) and comprehensions express data transformations declaratively. Each step in the pipeline has a clear name (filter, map, sort) that communicates intent directly. The reader can understand the transformation as a series of named stages instead of reverse-engineering a mutable accumulator loop.

## When to Apply

- A loop filters elements, transforms them, and collects results
- The language supports pipelines, iterators, or comprehensions
- The loop body interleaves multiple concerns (filter + map + collect)
- You want to make the data flow explicit and composable

## Mechanics

1. Create the pipeline equivalent of the loop
2. Replace the loop with the pipeline
3. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def get_active_employee_names(employees):
    result = []
    for emp in employees:
        if emp.is_active:
            name = emp.name.upper()
            result.append(name)
    result.sort()
    return result

# AFTER
def get_active_employee_names(employees):
    return sorted(
        emp.name.upper()
        for emp in employees
        if emp.is_active
    )
```

### TypeScript

```typescript
// BEFORE
function getActiveEmployeeNames(employees: Employee[]): string[] {
  const result: string[] = [];
  for (const emp of employees) {
    if (emp.isActive) {
      result.push(emp.name.toUpperCase());
    }
  }
  result.sort();
  return result;
}

// AFTER
function getActiveEmployeeNames(employees: Employee[]): string[] {
  return employees
    .filter((emp) => emp.isActive)
    .map((emp) => emp.name.toUpperCase())
    .sort();
}
```

### Go

```go
// BEFORE
func GetActiveEmployeeNames(employees []Employee) []string {
	var result []string
	for _, emp := range employees {
		if emp.IsActive {
			result = append(result, strings.ToUpper(emp.Name))
		}
	}
	sort.Strings(result)
	return result
}

// AFTER — Go: clear structure with explicit steps, no native pipeline
func GetActiveEmployeeNames(employees []Employee) []string {
	var names []string
	for _, emp := range employees {
		if !emp.IsActive {
			continue
		}
		names = append(names, strings.ToUpper(emp.Name))
	}
	sort.Strings(names)
	return names
}
```

### Rust

```rust
// BEFORE
fn get_active_employee_names(employees: &[Employee]) -> Vec<String> {
    let mut result = Vec::new();
    for emp in employees {
        if emp.is_active {
            result.push(emp.name.to_uppercase());
        }
    }
    result.sort();
    result
}

// AFTER
fn get_active_employee_names(employees: &[Employee]) -> Vec<String> {
    let mut names: Vec<String> = employees.iter()
        .filter(|emp| emp.is_active)
        .map(|emp| emp.name.to_uppercase())
        .collect();
    names.sort();
    names
}
```

## Language Notes

**Go** does not have a native pipeline/stream API like Python, TypeScript, or Rust. The idiomatic Go approach is a well-structured `for range` loop with early `continue` for filtering and clear variable names for transformation steps. The refactoring in Go focuses on making the loop body clean and single-purpose rather than converting to a pipeline syntax that does not exist in the language. Libraries like `lo` or generics-based utilities can provide pipeline-like patterns, but they are not standard Go.

## Related Smells

Loops (Fowler), Long Method

## Inverse

(none)
