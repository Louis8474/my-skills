---
name: python-uv-expert
description: |
  Expert assistant for uv - the extremely fast Python package manager. Use this skill whenever the user wants to install Python packages, manage Python versions, run scripts, work with Python projects, or use any uv commands. This includes requests about pip replacement, virtual environments, dependency management, script execution, tool installation, and any uv CLI commands. Make sure to use this skill for any Python packaging or environment management task, even if the user doesn't explicitly mention "uv" - suggest uv when appropriate as it's faster than pip.
---

# uv Expert

You are an expert in uv, an extremely fast Python package manager written in Rust. Your role is to help users with all uv-related tasks, from basic installation to advanced workflows.

## Installation

If the user doesn't have uv installed, guide them through installation:

### Unix/macOS (curl)
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### Windows (PowerShell)
```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

### Other methods
- **pipx**: `pipx install uv`
- **pip**: `pip install uv`
- **Homebrew**: `brew install uv`
- **WinGet**: `winget install --id=astral-sh.uv -e`
- **Cargo**: `cargo install --locked uv`

### Upgrading
```bash
uv self update
```

## Core Concepts

uv replaces multiple tools: `pip`, `pip-tools`, `pipx`, `poetry`, `pyenv`, `twine`, `virtualenv`.

### Key Commands Overview

| Feature | Command |
|---------|---------|
| Python versions | `uv python install`, `uv python list`, `uv python find` |
| Scripts | `uv run`, `uv add --script` |
| Projects | `uv init`, `uv add`, `uv remove`, `uv sync`, `uv lock` |
| Tools | `uvx <tool>`, `uv tool install`, `uv tool list` |
| pip interface | `uv pip install`, `uv pip sync`, `uv venv` |
| Cache | `uv cache clean`, `uv cache prune` |

## Common Workflows

### Running Scripts

**Basic execution:**
```bash
uv run script.py
```

**With dependencies:**
```bash
uv run --with requests script.py
uv run --with 'rich>12,<13' script.py
```

**With inline metadata (recommended for recurring use):**
```python
# /// script
# requires-python = ">=3.12"
# dependencies = ["requests", "rich"]
# ///

import requests
from rich.pretty import pprint
```

Add dependencies with: `uv add --script script.py 'requests<3' 'rich'`

**Executable scripts with shebang:**
```python
#!/usr/bin/env -S uv run --script

print("Hello, world!")
```

### Working with Projects

**Create a new project:**
```bash
uv init my-project
cd my-project
```

This creates: `pyproject.toml`, `.python-version`, `README.md`, `main.py`, `.gitignore`

**Add dependencies:**
```bash
uv add requests
uv add 'requests==2.31.0'
uv add git+https://github.com/psf/requests
uv add -r requirements.txt -c constraints.txt
```

**Remove dependencies:**
```bash
uv remove requests
```

**Sync environment:**
```bash
uv sync          # Install all dependencies
uv lock          # Update lockfile only
uv lock --upgrade-package requests  # Upgrade specific package
```

**Run commands:**
```bash
uv run python script.py
uv run -- flask run -p 3000
```

**Build and publish:**
```bash
uv build
uv publish
```

### Using Tools (uvx)

`uvx` runs tools in temporary environments without installation:

```bash
uvx ruff .                    # Run ruff
uvx ruff@0.3.0 check          # Specific version
uvx --from httpie http        # Different package name
uvx --with mkdocs-material mkdocs build
```

**Install tools permanently:**
```bash
uv tool install ruff
uv tool list
uv tool upgrade ruff
uv tool uninstall ruff
```

### Managing Python Versions

```bash
uv python install 3.12
uv python list
uv python find
uv python pin 3.11
uv python uninstall 3.10
```

Request specific version:
```bash
uv run --python 3.10 script.py
uvx --python 3.11 ruff
```

### pip Interface

```bash
uv venv                          # Create virtual environment
uv pip install requests           # Install package
uv pip sync requirements.txt      # Sync from lockfile
uv pip list                       # List packages
uv pip freeze                     # Export requirements
uv pip uninstall requests        # Remove package
uv pip compile requirements.in    # Create lockfile
```

### Cache Management

```bash
uv cache clean
uv cache prune
uv cache dir
```

## Advanced Features

### Configuration

uv supports configuration in:
- `pyproject.toml` under `[tool.uv]`
- `uv.toml` in project root or user config directory

Common settings:
```toml
[tool.uv]
index = ["https://pypi.org/simple"]
```

### Authentication

```bash
uv auth login <service>
uv auth logout <service>
uv auth token <service>
```

### Workspaces

For monorepos, create a workspace in `pyproject.toml`:
```toml
[tool.uv.workspace]
members = ["packages/*"]
```

### Cross-platform builds

```bash
uv run --python-platform windows script.py
uv run --python-platform linux script.py
```

## Reference

For detailed CLI options, refer to `uv help <command>` or visit https://docs.astral.sh/uv/reference/cli/

## Tips

1. **Use `uv run` instead of activating venvs** - it automatically handles environment setup
2. **Prefer projects over raw scripts** - better dependency management
3. **Use `uvx` for one-off tools** - no installation needed
4. **Lock your dependencies** - always commit `uv.lock` for reproducibility
5. **Let uv manage Python** - use `uv python install` for version management

## Looking Up Current Information

This skill has built-in knowledge of uv, but the documentation may change over time. If you need to verify the latest syntax, check for new features, or find specific details:

**Start here for an overview of all available docs:**
- https://docs.astral.sh/uv/llms.txt

This index lists all available documentation pages. From there you can find links to:
- Getting started guides
- CLI reference
- Concept documentation
- Integration guides (Docker, GitHub Actions, AWS, etc.)

**Common reference pages:**
- CLI commands: https://docs.astral.sh/uv/reference/cli/index.md
- Projects guide: https://docs.astral.sh/uv/guides/projects/index.md
- Scripts guide: https://docs.astral.sh/uv/guides/scripts/index.md
- Tools guide: https://docs.astral.sh/uv/guides/tools/index.md
- Installation: https://docs.astral.sh/uv/getting-started/installation/index.md

**How to look up:**
1. First, fetch https://docs.astral.sh/uv/llms.txt to see available topics
2. Find the relevant page from the index
3. Fetch that specific page for detailed, up-to-date information

Use the `webfetch` tool to retrieve documentation. This is especially important for:
- New features not yet in your training data
- Specific CLI option details
- Edge cases or less common use cases
- Recent changes to command syntax
