# Form Template Method

**Category:** Dealing with Generalization
**Sources:** Fowler Ch.12, Shvets Ch.11

## Problem

Two types have methods with the same overall structure but different details in some steps. The shared algorithm is duplicated, and only the varying steps differ between the types.

## Motivation

When the skeleton of an algorithm is the same across types but individual steps vary, you can extract the skeleton into a template method. The template method defines the sequence, and subclasses (or strategy objects) provide the varying steps. This eliminates the duplicated structure while preserving flexibility in the details.

## When to Apply

- Two or more types have methods that follow the same sequence of steps
- Only specific steps differ between the types
- Adding a new variant means copying the entire method and changing a few lines
- The structure of the algorithm is stable but the details vary

## Mechanics

1. Identify the shared algorithm structure in both methods
2. Break each method into the same sequence of steps (same names, same order)
3. Pull the skeleton method into a parent / trait / shared function
4. Make the varying steps abstract (or accept them as callbacks/strategies)
5. Each subtype implements only the varying steps
6. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
class TextReport:
    def generate(self, data: list[dict]) -> str:
        result = "=== Report ===\n"
        for item in data:
            result += f"{item['name']}: {item['value']}\n"
        result += f"Total: {sum(i['value'] for i in data)}\n"
        return result

class HtmlReport:
    def generate(self, data: list[dict]) -> str:
        result = "<h1>Report</h1><table>"
        for item in data:
            result += f"<tr><td>{item['name']}</td><td>{item['value']}</td></tr>"
        result += f"</table><p>Total: {sum(i['value'] for i in data)}</p>"
        return result

# AFTER
from abc import ABC, abstractmethod

class Report(ABC):
    def generate(self, data: list[dict]) -> str:
        parts = [self.header()]
        parts.extend(self.format_item(item) for item in data)
        parts.append(self.footer(sum(i["value"] for i in data)))
        return "".join(parts)

    @abstractmethod
    def header(self) -> str: ...
    @abstractmethod
    def format_item(self, item: dict) -> str: ...
    @abstractmethod
    def footer(self, total: float) -> str: ...

class TextReport(Report):
    def header(self) -> str: return "=== Report ===\n"
    def format_item(self, item: dict) -> str: return f"{item['name']}: {item['value']}\n"
    def footer(self, total: float) -> str: return f"Total: {total}\n"

class HtmlReport(Report):
    def header(self) -> str: return "<h1>Report</h1><table>"
    def format_item(self, item: dict) -> str:
        return f"<tr><td>{item['name']}</td><td>{item['value']}</td></tr>"
    def footer(self, total: float) -> str: return f"</table><p>Total: {total}</p>"
```

### TypeScript

```typescript
// BEFORE
class TextReport {
  generate(data: { name: string; value: number }[]): string {
    let result = "=== Report ===\n";
    for (const item of data) result += `${item.name}: ${item.value}\n`;
    result += `Total: ${data.reduce((s, i) => s + i.value, 0)}\n`;
    return result;
  }
}

class HtmlReport {
  generate(data: { name: string; value: number }[]): string {
    let result = "<h1>Report</h1><table>";
    for (const item of data) result += `<tr><td>${item.name}</td><td>${item.value}</td></tr>`;
    result += `</table><p>Total: ${data.reduce((s, i) => s + i.value, 0)}</p>`;
    return result;
  }
}

// AFTER
type Item = { name: string; value: number };

abstract class Report {
  generate(data: Item[]): string {
    const total = data.reduce((s, i) => s + i.value, 0);
    return this.header() + data.map(i => this.formatItem(i)).join("") + this.footer(total);
  }
  protected abstract header(): string;
  protected abstract formatItem(item: Item): string;
  protected abstract footer(total: number): string;
}

class TextReport extends Report {
  protected header() { return "=== Report ===\n"; }
  protected formatItem(item: Item) { return `${item.name}: ${item.value}\n`; }
  protected footer(total: number) { return `Total: ${total}\n`; }
}

class HtmlReport extends Report {
  protected header() { return "<h1>Report</h1><table>"; }
  protected formatItem(item: Item) { return `<tr><td>${item.name}</td><td>${item.value}</td></tr>`; }
  protected footer(total: number) { return `</table><p>Total: ${total}</p>`; }
}
```

### Go

```go
// Go: use strategy pattern — an interface for varying steps + shared function.

// BEFORE — duplicated structure in two functions
// (similar to Python BEFORE, omitted for brevity)

// AFTER
type Item struct {
	Name  string
	Value float64
}

type ReportFormatter interface {
	Header() string
	FormatItem(item Item) string
	Footer(total float64) string
}

func GenerateReport(f ReportFormatter, data []Item) string {
	var b strings.Builder
	b.WriteString(f.Header())
	total := 0.0
	for _, item := range data {
		b.WriteString(f.FormatItem(item))
		total += item.Value
	}
	b.WriteString(f.Footer(total))
	return b.String()
}

type TextFormatter struct{}

func (TextFormatter) Header() string                { return "=== Report ===\n" }
func (TextFormatter) FormatItem(i Item) string      { return fmt.Sprintf("%s: %.0f\n", i.Name, i.Value) }
func (TextFormatter) Footer(total float64) string   { return fmt.Sprintf("Total: %.0f\n", total) }

type HtmlFormatter struct{}

func (HtmlFormatter) Header() string              { return "<h1>Report</h1><table>" }
func (HtmlFormatter) FormatItem(i Item) string    { return fmt.Sprintf("<tr><td>%s</td><td>%.0f</td></tr>", i.Name, i.Value) }
func (HtmlFormatter) Footer(total float64) string { return fmt.Sprintf("</table><p>Total: %.0f</p>", total) }
```

### Rust

```rust
// Rust: trait with a default method calling required methods.

// AFTER
struct Item { name: String, value: f64 }

trait ReportFormatter {
    fn header(&self) -> String;
    fn format_item(&self, item: &Item) -> String;
    fn footer(&self, total: f64) -> String;

    // Template method — default implementation defines the skeleton
    fn generate(&self, data: &[Item]) -> String {
        let total: f64 = data.iter().map(|i| i.value).sum();
        let mut result = self.header();
        for item in data {
            result.push_str(&self.format_item(item));
        }
        result.push_str(&self.footer(total));
        result
    }
}

struct TextReport;

impl ReportFormatter for TextReport {
    fn header(&self) -> String { "=== Report ===\n".into() }
    fn format_item(&self, item: &Item) -> String { format!("{}: {}\n", item.name, item.value) }
    fn footer(&self, total: f64) -> String { format!("Total: {total}\n") }
}

struct HtmlReport;

impl ReportFormatter for HtmlReport {
    fn header(&self) -> String { "<h1>Report</h1><table>".into() }
    fn format_item(&self, item: &Item) -> String {
        format!("<tr><td>{}</td><td>{}</td></tr>", item.name, item.value)
    }
    fn footer(&self, total: f64) -> String {
        format!("</table><p>Total: {total}</p>")
    }
}
```

## Language Notes

- **Go**: No abstract classes. Use the strategy pattern instead: define an interface for the varying steps and a standalone function for the skeleton algorithm that accepts the interface. The function is the template, the interface implementations are the variants.
- **Rust**: Traits support default methods, which map naturally to template methods. Define the varying steps as required methods and the skeleton as a default method that calls them. Each implementor provides only the varying steps.

## Related Smells

Duplicated Code

## Inverse

(none)
