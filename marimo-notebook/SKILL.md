---
name: marimo-notebook
description: |
  Author interactive reactive Python notebooks with marimo.
  Covers interactive cell execution, reactive UI, SQL, state management,
  deployment, and export. For interactive notebooks, NOT Cell.run() API.
license: MIT
compatibility: opencode
metadata:
  audience: data-scientists
  category: data-science
  framework: marimo
---

# Marimo Notebook Skill

## Running & Editing

```bash
# Edit interactively in browser
uv run marimo edit <notebook.py>

# Run as web app (code hidden)
uv run marimo run <notebook.py>

# Run as plain script (non-interactive, for testing/CI)
uv run <notebook.py>

# Lint for common mistakes — always run before handing back to user
uvx marimo check <notebook.py>
uvx marimo check --fix <notebook.py>
```

## When to use this skill

- Creating .py notebook files for interactive data exploration
- Building reactive dashboards/apps with marimo
- Converting Jupyter notebooks (.ipynb) to marimo

Ask clarifying questions if:
- User mentions "Cell.run()", "reusable cells", or "testing cells" (API use case, different patterns)
- User wants to "pass variables between cells" with parameters/returns (wrong mental model)

---

## File Format

Marimo notebooks are `.py` files. Each cell is a function decorated with `@app.cell`.
Marimo resolves dependencies via **static analysis of the cell body** — it reads what
variables you assign and reference, then builds a DAG automatically.

When marimo saves, it auto-generates function parameters and return tuples as
serialization metadata. **You don't need to manage these yourself.** Write `def _():`
for all cells. Marimo handles the rest.

```python
# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "marimo",
#     "pandas",
#     "numpy",
# ]
# ///

import marimo

__generated_with = "0.19.7"
app = marimo.App(width="medium")

@app.cell
def _():
    import marimo as mo
    import pandas as pd
    import numpy as np

@app.cell
def _():
    # df is automatically available to all other cells
    df = pd.read_parquet("data/input.parquet")

@app.cell
def _():
    # Reference df directly — marimo knows the dependency
    filtered = df[df["value"] > threshold.value]
    mo.md(f"**{len(filtered)} rows** after filtering")

if __name__ == "__main__":
    app.run()
```

PEP 723 inline dependencies (`# /// script` block) are added automatically by
`marimo edit --sandbox` but should always be present. They enable `--sandbox`
mode for isolated execution.

---

## Core Mental Model

### Variables Are Automatically Global

Assign a variable in any cell and it's available everywhere. Marimo's static
analysis handles dependency resolution. No explicit exports needed.

```python
@app.cell
def _():
    df = pd.read_csv("data.csv")  # df is available to all cells
    df.head()  # Bare expression = displayed in UI

@app.cell
def _():
    summary = df.describe()  # Just reference df directly
    summary
```

Use `_prefix` (e.g., `_tmp`, `_i`) for cell-local variables that shouldn't leak:

```python
@app.cell
def _():
    _tmp = []
    for _i in range(10):
        _tmp.append(_i * 2)
    result = sum(_tmp)  # Only result is global
```

Don't use `_prefix` to dodge "variable already defined" errors — refactor to
meaningful unique names instead.

### Two Output Channels Per Cell

Every cell has two independent channels:

1. **Display** — the last bare expression (rendered in the UI)
2. **Sharing** — any variable assigned in the cell body is automatically global

A cell can do both, either, or neither.

```python
# Display only — shows controls
@app.cell
def _():
    mo.hstack([months_slider, outlier_input], justify="start")

# Share only — computes, no visual output
@app.cell
def _():
    filtered = filter_outliers(predictions)
    outlier_count = len(predictions) - len(filtered)

# Both — creates a UI element AND displays it
@app.cell
def _():
    period_selector = mo.ui.dropdown(options=options, value=default)
    mo.hstack([mo.md("### Analysis"), period_selector])

# Neither — defines helpers
@app.cell
def _():
    def calculate_rmse(preds, actuals):
        return np.sqrt(np.mean((preds - actuals) ** 2))
```

Only the **final expression** renders. Indented or conditional expressions won't:

```python
# BAD — indented expression won't render
@app.cell
def _():
    if condition:
        mo.md("This won't show!")

# GOOD — final expression renders
@app.cell
def _():
    output = mo.md("Shown!") if condition else mo.md("Also shown!")
    output
```

### Cells Don't Take Parameters

Never use function parameters for cell-to-cell data flow. Reference variables directly.

```python
# WRONG
@app.cell
def analyze(df):  # Don't declare parameters for sharing
    df.describe()

# RIGHT
@app.cell
def _():
    df.describe()  # Direct reference — marimo resolves the dependency
```

### About Return Tuples in .py Files

When marimo serializes a notebook, it adds `return (var1, var2)` lines. These are
marimo's bookkeeping — don't add or maintain them yourself. If they appear in a
file you're editing, leave them alone; marimo will update them on next save.

---

## Rules

### NO_PRINT: Use marimo Output, Not print()

`print()` works in edit mode but fails silently in run/app mode.

```python
# WRONG
print(f"Accuracy: {accuracy}")

# GOOD
mo.md(f"**Accuracy:** {accuracy:.2%}")
mo.stat(value=f"{accuracy:.2%}", label="Accuracy")
f"Processed {len(df)} rows"  # Bare expression
```

### UI_GLOBAL: UI Elements Must Be Global

Assign UI elements to global variables (no `_` prefix) for reactivity tracking.

```python
# GOOD
@app.cell
def _():
    slider = mo.ui.slider(1, 10)
    slider  # Display it

# WRONG — local, breaks reactivity
@app.cell
def _():
    _slider = mo.ui.slider(1, 10)
    _slider
```

### UI_VALUE_ACCESS: Read .value in a Different Cell

Define UI in one cell, read `.value` in another. Reading `.value` in the same
cell as definition breaks reactivity — the defining cell doesn't re-run on
interaction, only dependent cells do.

```python
# Cell 1 — define and display
@app.cell
def _():
    slider = mo.ui.slider(1, 10)
    slider

# Cell 2 — read value (re-runs when slider changes)
@app.cell
def _():
    mo.md(f"Value: {slider.value}")
```

Exception: SQL cells return DataFrames directly (no `.value`).

### NO_ON_CHANGE: Don't Use on_change Handlers

Use marimo's built-in reactive execution instead. Cells that reference a UI
element's `.value` re-run automatically.

```python
# WRONG
@app.cell
def _():
    slider = mo.ui.slider(on_change=lambda v: update(v))

# RIGHT — let reactivity handle it
@app.cell
def _():
    slider = mo.ui.slider(1, 10)
    slider

@app.cell
def _():
    filtered = df[df["x"] > slider.value]  # Auto re-runs
```

Exception: `on_change` is legitimate with `mo.state()` for accumulated callback
state (see State Management below).

### NO_MUTATION_ACROSS_CELLS: Mutate Where Defined

Marimo doesn't track object mutations. Mutate in the same cell that creates the
object, or create new variables.

```python
# BAD
@app.cell
def _():
    items = [1, 2, 3]

@app.cell
def _():
    items.append(4)  # Marimo won't know this happened

# GOOD — create new
@app.cell
def _():
    extended = items + [4]

# GOOD — mutate where defined
@app.cell
def _():
    items = [1, 2, 3]
    items.append(4)
```

### STOP_NOT_EXCEPTION: Use mo.stop for Graceful Halting

```python
# GOOD
@app.cell
def _():
    mo.stop(not data_loaded, mo.callout(f"Error: {error_msg}", kind="error"))
    mo.md("## Dashboard Ready")

# WRONG — ugly red error UI
@app.cell
def _():
    if not data_loaded:
        raise ValueError("Data not found")
```

### FORM_GATE: Check form.value for None

`form.value` is `None` until submit is clicked.

```python
@app.cell
def _():
    mo.stop(form.value is None, "Submit to process")
    result = analyze(form.value)
```

### IDEMPOTENT_CELLS: Same Inputs → Same Outputs

Cells re-run when dependencies change. Non-idempotent cells cause unpredictable state.

```python
# BAD — accumulates on every re-run
@app.cell
def _():
    results.append(compute())

# GOOD — fresh every time
@app.cell
def _():
    results = [compute()]
```

### DON'T_GUARD_UNNECESSARILY

Marimo's reactivity means cells only run when dependencies are ready.

```python
# BAD — unnecessary guard
@app.cell
def _():
    if training_results:
        fig, ax = plt.subplots()
        ax.plot(training_results["losses"])
        fig

# GOOD — cell won't run until training_results exists
@app.cell
def _():
    fig, ax = plt.subplots()
    ax.plot(training_results["losses"])
    fig
```

### DON'T_TRY_EXCEPT_FOR_CONTROL_FLOW

Let errors surface. Only use try/except for specific, expected exceptions
with meaningful recovery (e.g., `FileNotFoundError` when loading optional data).

---

## Script Mode Detection

Use `mo.app_meta().mode` to detect CLI vs interactive execution:

```python
@app.cell
def _():
    is_script_mode = mo.app_meta().mode == "script"
```

Show all UI elements always — only change the data source in script mode:

```python
@app.cell
def _():
    slider = mo.ui.slider(start=0.001, stop=0.1, value=0.01)
    slider

@app.cell
def _():
    if is_script_mode:
        results = run_training(X, y, lr=slider.value)  # Auto-run
    else:
        mo.stop(not train_button.value, "Click to train")
        results = run_training(X, y, lr=slider.value)
```

---

## SQL

Under the hood, SQL cells call `mo.sql()`. By default marimo uses DuckDB
in-memory and can reference any DataFrame variable in scope.

```python
@app.cell
def _():
    grouped = mo.sql(
        f"""
        SELECT category, MEAN(value) as mean
        FROM df
        GROUP BY category
        ORDER BY mean
        """,
        output=False  # Don't auto-display, just return the DataFrame
    )
```

`grouped` is a Polars DataFrame (configurable to Pandas). No `.value` needed.

Signature: `mo.sql(query: str, *, output: bool = True, engine: Optional[DBAPIConnection] = None)`

### External engines

```python
# SQLAlchemy
import sqlalchemy
engine = sqlalchemy.create_engine("sqlite:///:memory:")
result = mo.sql("SELECT * FROM users", engine=engine)

# DuckDB file
import duckdb
conn = duckdb.connect("file.db", read_only=True)
result = mo.sql("SELECT * FROM sales", engine=conn)
```

---

## State Management

Regular variables between cells ARE your state. Widget `.value` works the same
way. No store, no session_state, no hooks needed for 99% of cases.

### When you DO need mo.state()

Use it for **accumulated state from callbacks** or **bidirectional UI sync**.

```python
@app.cell
def _():
    get_items, set_items = mo.state([])

@app.cell
def _():
    task = mo.ui.text(label="New task")
    add = mo.ui.button(
        label="Add",
        on_click=lambda _: set_items(lambda d: d + [task.value])
    )
    mo.hstack([task, add])

@app.cell
def _():
    mo.md("\n".join(f"- {t}" for t in get_items()))
```

Bidirectional sync (slider ↔ number input):

```python
@app.cell
def _():
    get_n, set_n = mo.state(50)

@app.cell
def _():
    slider = mo.ui.slider(0, 100, value=get_n(), on_change=set_n)
    number = mo.ui.number(0, 100, value=get_n(), on_change=set_n)
    mo.hstack([slider, number])
```

**Warnings:**
- Don't store `mo.ui` elements inside state
- Don't use `on_change` when you can just read `.value` from another cell
- The cell calling the setter does NOT re-run (unless `allow_self_loops=True`)

---

## UI Components Quick Reference

Core inputs: `mo.ui.slider`, `mo.ui.number`, `mo.ui.text`, `mo.ui.text_area`,
`mo.ui.dropdown`, `mo.ui.radio`, `mo.ui.checkbox`, `mo.ui.date`, `mo.ui.file`,
`mo.ui.button`, `mo.ui.run_button`

Data: `mo.ui.table`, `mo.ui.dataframe`, `mo.ui.data_explorer`

Charts: `mo.ui.altair_chart`, `mo.ui.plotly`

Layout: `mo.ui.tabs`, `mo.ui.array`

Composition: `mo.ui.form`, `.batch().form()`

### Forms with .batch().form()

Compose multiple UI elements into a single form with a submit button:

```python
@app.cell
def _():
    form = (
        mo.md("""
        **Choice** {choice}
        **Text** {text}
        **Flag** {flag}
        """)
        .batch(
            choice=mo.ui.dropdown(options=["A", "B", "C"]),
            text=mo.ui.text(),
            flag=mo.ui.checkbox(),
        )
        .form(submit_button_label="Submit", show_clear_button=True)
    )
    form

@app.cell
def _():
    mo.stop(form.value is None, "Submit the form first")
    # form.value is a dict: {"choice": ..., "text": ..., "flag": ...}
```

Add validation to block submission:

```python
mo.ui.dropdown(options=columns, allow_select_none=True, value=None).form(
    submit_button_label="Apply",
    validate=lambda v: "Select a column" if v is None else None,
)
```

### Checking API docs at runtime

```bash
uv --with marimo run python -c "import marimo as mo; help(mo.ui.form)"
```

---

## Top-Level Imports: @app.function and @app.class_definition

Expose functions/classes for import by other Python scripts or notebooks.

Requirements:
- Cell defines exactly one function or class
- Can only reference symbols from `app.setup` or other top-level symbols

```python
import marimo

app = marimo.App()

with app.setup:
    import numpy as np

@app.function
def calculate_statistics(data):
    return {
        "mean": np.mean(data),
        "std": np.std(data),
    }

if __name__ == "__main__":
    app.run()
```

Then from another file:

```python
from my_notebook import calculate_statistics
stats = calculate_statistics([1, 2, 3, 4, 5])
```

---

## Module Splitting

When a notebook gets too long, extract logic into helper `.py` modules and import
them. Enable marimo's built-in module autoreloading so edits propagate without
restarting.

---

## Export

```bash
uvx marimo export html notebook.py -o out.html
uvx marimo export pdf notebook.py -o out.pdf
uvx marimo export script notebook.py -o flat.py    # Flattened topological script
uvx marimo export md notebook.py -o out.md
uvx marimo export ipynb notebook.py -o out.ipynb
uvx marimo export html-wasm notebook.py -o out.html # WASM-powered, runs in browser
```

PDF export needs `nbformat`, `nbconvert`, and Chromium (`playwright install chromium`).

Useful PDF flags: `--no-include-inputs` (hide code), `--as=slides` (reveal.js deck),
`--raster-scale 4.0` (sharpness).

Common flags across exports: `-o` (output path), `--watch` (re-export on change),
`--sandbox` (isolated uv env), `-f` (overwrite).

---

## Deployment

```bash
# Single notebook as web app
uvx marimo run --sandbox notebook.py

# Folder of notebooks
uvx marimo run --sandbox <folder>

# Generate thumbnails for multi-notebook deployment
uvx marimo export thumbnail notebook.py
```

Add metadata for overview pages:

```python
# /// script
# requires-python = ">=3.12"
# dependencies = ["marimo", "polars"]
# [tool.marimo.opengraph]
# title = "My Dashboard"
# description = "Portfolio tracking over time"
# ///
```

---

## Validation Checklist

- [ ] All cells use `def _():` — no manual parameters
- [ ] Variables referenced by direct name across cells
- [ ] Bare expression as last line for display output
- [ ] UI elements assigned to globals (no `_` prefix)
- [ ] `.value` read in DIFFERENT cell from UI definition
- [ ] No `on_change` callbacks (unless `mo.state()` accumulation)
- [ ] No `print()` — use `mo.md()` / `mo.stat()` / bare expressions
- [ ] No mutation across cells
- [ ] Cell-local temps use `_` prefix
- [ ] `mo.stop()` for conditional halts (not exceptions)
- [ ] Cells are idempotent
- [ ] PEP 723 dependencies present
- [ ] `marimo check` passes

## Common Jupyter Idioms That Break

| Jupyter / Naive Python | Marimo |
|------------------------|--------|
| `def analyze(df):` cell params | `def _():` + direct reference |
| `print()` for output | `mo.md()`, `mo.stat()`, bare expression |
| Read `.value` in same cell as UI def | Define UI in one cell, read in another |
| `on_change` callbacks | Reactive execution |
| Mutate objects across cells | Mutate where defined or create new |
| `raise` for user errors | `mo.stop(condition, message)` |
| `if guard:` before using variable | Cell won't run until dependency exists |

## References

- https://docs.marimo.io/getting_started/key_concepts/
- https://docs.marimo.io/guides/reactivity/
- https://docs.marimo.io/guides/interactivity/
- https://docs.marimo.io/guides/best_practices/
- https://docs.marimo.io/guides/lint_rules/
