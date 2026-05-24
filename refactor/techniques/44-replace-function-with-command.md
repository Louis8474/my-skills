# Replace Function with Command / Replace Method with Method Object

**Category:** Simplifying Method Calls
**Sources:** Fowler Ch.6

## Problem

A function is complex with many parameters and local variables making it hard to decompose. You cannot easily extract smaller functions because the local state is deeply intertwined, or you need undo/queue/log capabilities that a plain function cannot provide.

## Motivation

When a function grows too complex, turning it into a command object (method object) gives you a dedicated namespace for its local state. Parameters become fields, and you can break the monolithic logic into smaller private methods that share state through the object. The command pattern also enables undo, queuing, logging, and deferred execution.

## When to Apply

- Function has many parameters and local variables that make extraction hard
- You need undo, redo, or transaction support
- You want to queue or schedule the operation
- The function's logic would benefit from being split into smaller cooperating methods
- You need to track execution state or progress

## Mechanics

1. Create a new class/struct named after the function (or as a Command)
2. Move the function's parameters into the constructor (become fields)
3. Move the function body into an `execute` (or `run`) method
4. Break the large method into smaller private methods that use shared fields
5. Replace the original function with construction + execute
6. Test

## Multi-Language Examples

> For Java examples, see the `refactor-java` skill.

### Python

```python
# BEFORE
def score_applicant(name: str, income: float, credit: int,
                    years_employed: int, has_references: bool) -> str:
    base = min(income / 1000, 100)
    credit_factor = credit / 850
    experience = min(years_employed * 5, 30)
    ref_bonus = 10 if has_references else 0
    total = base * credit_factor + experience + ref_bonus
    if total > 80: return "approved"
    if total > 50: return "review"
    return "denied"

# AFTER
class ScoreApplicant:
    def __init__(self, name: str, income: float, credit: int,
                 years_employed: int, has_references: bool):
        self.name = name
        self.income = income
        self.credit = credit
        self.years_employed = years_employed
        self.has_references = has_references

    def execute(self) -> str:
        total = self._base_score() + self._experience_score() + self._ref_bonus()
        return self._classify(total)

    def _base_score(self) -> float:
        return min(self.income / 1000, 100) * (self.credit / 850)

    def _experience_score(self) -> float:
        return min(self.years_employed * 5, 30)

    def _ref_bonus(self) -> float:
        return 10 if self.has_references else 0

    def _classify(self, total: float) -> str:
        if total > 80: return "approved"
        if total > 50: return "review"
        return "denied"
```

### TypeScript

```typescript
// BEFORE
function scoreApplicant(name: string, income: number, credit: number,
                        yearsEmployed: number, hasReferences: boolean): string {
  const base = Math.min(income / 1000, 100);
  const creditFactor = credit / 850;
  const experience = Math.min(yearsEmployed * 5, 30);
  const refBonus = hasReferences ? 10 : 0;
  const total = base * creditFactor + experience + refBonus;
  if (total > 80) return "approved";
  if (total > 50) return "review";
  return "denied";
}

// AFTER
class ScoreApplicant {
  constructor(
    private name: string,
    private income: number,
    private credit: number,
    private yearsEmployed: number,
    private hasReferences: boolean
  ) {}

  execute(): string {
    const total = this.baseScore() + this.experienceScore() + this.refBonus();
    return this.classify(total);
  }

  private baseScore(): number {
    return Math.min(this.income / 1000, 100) * (this.credit / 850);
  }

  private experienceScore(): number {
    return Math.min(this.yearsEmployed * 5, 30);
  }

  private refBonus(): number {
    return this.hasReferences ? 10 : 0;
  }

  private classify(total: number): string {
    if (total > 80) return "approved";
    if (total > 50) return "review";
    return "denied";
  }
}
```

### Go

```go
// BEFORE
func ScoreApplicant(name string, income float64, credit int,
	yearsEmployed int, hasReferences bool) string {
	base := math.Min(income/1000, 100)
	creditFactor := float64(credit) / 850
	experience := math.Min(float64(yearsEmployed)*5, 30)
	refBonus := 0.0
	if hasReferences { refBonus = 10 }
	total := base*creditFactor + experience + refBonus
	if total > 80 { return "approved" }
	if total > 50 { return "review" }
	return "denied"
}

// AFTER
type scoreApplicantCmd struct {
	name          string
	income        float64
	credit        int
	yearsEmployed int
	hasReferences bool
}

func (c *scoreApplicantCmd) Execute() string {
	total := c.baseScore() + c.experienceScore() + c.refBonus()
	return c.classify(total)
}

func (c *scoreApplicantCmd) baseScore() float64 {
	return math.Min(c.income/1000, 100) * (float64(c.credit) / 850)
}

func (c *scoreApplicantCmd) experienceScore() float64 {
	return math.Min(float64(c.yearsEmployed)*5, 30)
}

func (c *scoreApplicantCmd) refBonus() float64 {
	if c.hasReferences { return 10 }
	return 0
}

func (c *scoreApplicantCmd) classify(total float64) string {
	if total > 80 { return "approved" }
	if total > 50 { return "review" }
	return "denied"
}
```

### Rust

```rust
// BEFORE
fn score_applicant(name: &str, income: f64, credit: u32,
                   years_employed: u32, has_references: bool) -> &'static str {
    let base = (income / 1000.0).min(100.0);
    let credit_factor = credit as f64 / 850.0;
    let experience = (years_employed as f64 * 5.0).min(30.0);
    let ref_bonus = if has_references { 10.0 } else { 0.0 };
    let total = base * credit_factor + experience + ref_bonus;
    if total > 80.0 { "approved" } else if total > 50.0 { "review" } else { "denied" }
}

// AFTER
struct ScoreApplicant {
    name: String,
    income: f64,
    credit: u32,
    years_employed: u32,
    has_references: bool,
}

impl ScoreApplicant {
    fn execute(&self) -> &'static str {
        let total = self.base_score() + self.experience_score() + self.ref_bonus();
        self.classify(total)
    }

    fn base_score(&self) -> f64 {
        (self.income / 1000.0).min(100.0) * (self.credit as f64 / 850.0)
    }

    fn experience_score(&self) -> f64 {
        (self.years_employed as f64 * 5.0).min(30.0)
    }

    fn ref_bonus(&self) -> f64 {
        if self.has_references { 10.0 } else { 0.0 }
    }

    fn classify(&self, total: f64) -> &'static str {
        if total > 80.0 { "approved" } else if total > 50.0 { "review" } else { "denied" }
    }
}
```

## Related Smells

Long Method, Long Parameter List

## Inverse

(none)
