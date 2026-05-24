---
name: git-commit
description: "Execute git commit with conventional commit message analysis, intelligent staging, and message generation. Use when user asks to commit changes, create a git commit, or mentions \"/commit\". Supports: (1) Auto-detecting type and scope from changes, (2) Generating conventional commit messages from diff, (3) Interactive commit with optional type/scope/description overrides, (4) Intelligent file staging for logical grouping."
license: MIT
allowed-tools: Bash, Read, Glob, Grep
---

# Git Commit (Conventional Commits 1.0.0)

## Overview
This skill automates the creation of semantic git commits by analyzing codebase changes and strictly adhering to the **Conventional Commits 1.0.0** specification. It ensures project history is structured, machine-readable, and aligned with Semantic Versioning (SemVer).

## Core Capabilities

- Auto-detect commit type and scope from code changes
- Generate conventional commit messages with proper formatting
- Stage files intelligently based on logical grouping
- Handle breaking changes with appropriate markers
- Provide interactive clarification for ambiguous situations
- Support for conventional commit spec 1.0.0

## Reference Material
For the full technical specification of Conventional Commits 1.0.0, refer to:
- https://www.conventionalcommits.org/en/v1.0.0/

## Workflow

### 1. Create Todo List
Before executing any changes, you MUST create a structured todo list using the `todowrite` tool to track the following steps:
1. Analyze git status and diff
2. Clarify ambiguities (scope, breaking changes, staging preferences, commit format)
3. Stage relevant files
4. Draft conventional commit message
5. Execute commit
6. Verify commit success

### 2. Analyze Changes
Examine the current state of the repository to understand the context of the work.
```bash
git status --porcelain
git diff              # Unstaged changes
git diff --staged     # Staged changes
```

### 3. Clarify Ambiguities
If the request lacks details, use the `question` tool to ask:

1. **Scope**: "What scope should be used for this commit? (e.g., 'auth', 'api', 'ui', or leave empty for no scope)"
2. **Breaking Changes**: "Are these changes breaking? Should they be marked with '!' or include a BREAKING CHANGE footer?"
3. **Staging Preferences**: "Which files should be staged? (all changes, specific files, or only already staged files)"
4. **Commit Format**: "Should the commit message include a body? Any references to include in footer? (e.g., 'Refs: #123')"

### 4. Determine Intent & Category
Based on the diff, categorize the change according to the specification:
- **feat**: New feature (correlates with SemVer MINOR).
- **fix**: Bug fix (correlates with SemVer PATCH).
- **docs**: Documentation changes only.
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc).
- **refactor**: A code change that neither fixes a bug nor adds a feature.
- **perf**: A code change that improves performance.
- **test**: Adding missing tests or correcting existing tests.
- **build**: Changes that affect the build system or external dependencies.
- **ci**: Changes to CI configuration files and scripts.
- **chore**: Other changes that don't modify src or test files.
- **revert**: Reverts a previous commit.

### 5. Handle Breaking Changes
A breaking change MUST be indicated by:
1.  Appending a `!` after the type/scope (e.g., `feat(api)!: drop support for v1`).
2.  AND/OR including a `BREAKING CHANGE:` footer.
*Preference: Use `!` for visibility in the summary and a footer for detailed explanation.*

### 6. Construct the Message
- **Type**: Noun (feat, fix, etc.).
- **Scope (Optional)**: Noun describing a section of the codebase (e.g., `fix(parser):`).
- **Description**: Short summary in the **imperative, present tense** ("add", not "added").
- **Body (Optional)**: Detailed explanation, separated by a blank line.
- **Footer (Optional)**: External references (e.g., `Refs: #123`) or Breaking Change notes.

### 7. Execution
Stage relevant files and execute the commit.
```bash
git add <files>
git commit -m "<message>"
```

### 8. Verify Commit Success
Check that the commit succeeded:
```bash
git log --oneline -1
```

## Safety Protocol
- **Secrets**: NEVER commit files like `.env`, `credentials.json`, or private keys.
- **Force**: NEVER run destructive commands (`--force`, `hard reset`) unless explicitly requested.
- **Hooks**: If a commit fails due to a pre-commit hook, fix the issue and create a **NEW** commit. NEVER use `--no-verify` or `--amend` unless instructed.
- **Main Branch**: Warn the user before committing directly to `main` or `master`.

## Best Practices

1. **Always use conventional commits** for semantic versioning compatibility
2. **Keep commit messages concise** but descriptive
3. **Use imperative mood** in the description ("add feature" not "added feature")
4. **Reference issues** in footer when applicable
5. **Mark breaking changes clearly** with `!` and BREAKING CHANGE footer
6. **Stage related changes together** for logical commit grouping

## Gotchas

- **Scope detection**: The scope is not always obvious from the diff. When in doubt, ask the user.
- **Breaking changes**: Breaking changes are easy to miss. Always ask for confirmation.
- **Staging**: Never stage files without user confirmation if they're not already staged.
- **Commit message length**: Keep the first line under 72 characters for readability.
- **Pre-commit hooks**: If hooks fail, don't skip them unless absolutely necessary.

## Output Format

When executing a commit, provide:
1. Summary of changes detected
2. Proposed commit message (full format)
3. List of files to be staged
4. Confirmation before executing commit