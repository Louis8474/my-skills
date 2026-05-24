---
title: Memory Bank
description: File-based storage for all project artifacts with full traceability
---

## What is the Memory Bank?

The **Memory Bank** is a file-based storage system for all project artifacts. It maintains context across agent sessions and provides traceability between artifacts.

Unlike traditional documentation that gets stale, the Memory Bank is actively used by agents. It's the source of truth that agents read and write.

## Why Memory Bank?

- **Context Engineering** — Agents reload context from Memory Bank each session. No more lost knowledge.
- **Traceability** — Every artifact links to its source. Inception and construction logs provide full traceability.
- **Human Readable** — All files are Markdown. Review, edit, and version control with Git.
- **AI Accessible** — Structured format that agents can parse and update.

## Structure

```
memory-bank/
├── intents/                   # Your captured intents
│   └── {intent-name}/
│       ├── requirements.md
│       ├── system-context.md
│       └── units/
│           └── {unit-name}/
│               ├── unit-brief.md
│               ├── stories/
│               └── bolts/
├── bolts/                     # Bolt execution records
│   └── {bolt-id}/
│       ├── domain-model.md
│       ├── technical-design.md
│       └── implementation/
├── standards/                 # Project standards
│   ├── tech-stack.md
│   ├── coding-standards.md
│   ├── architecture.md
│   └── ux-guide.md
└── operations/                # Deployment context
    ├── environments.md
    └── runbooks/
```

## Artifact Types

### Standards
| File | Purpose |
|------|---------|
| `tech-stack.md` | Languages, frameworks, databases |
| `coding-standards.md` | Formatting, naming, patterns |
| `architecture.md` | System architecture decisions |
| `ux-guide.md` | Design system, styling |
| `api-conventions.md` | API style, versioning |

### Intent Artifacts
| File | Purpose |
|------|---------|
| `requirements.md` | User stories, acceptance criteria, NFRs |
| `system-context.md` | Boundaries, interfaces, constraints |
| `units.md` | Unit decomposition overview |

### Unit Artifacts
| File | Purpose |
|------|---------|
| `unit-brief.md` | Scope, interfaces, dependencies |
| `stories/*.md` | Individual user stories |
| `bolts/*/` | Bolt execution records |

### Bolt Artifacts
| File | Purpose |
|------|---------|
| `domain-model.md` | DDD artifacts |
| `technical-design.md` | Architecture decisions |
| `adr-*.md` | Architectural Decision Records |
| `implementation/` | Generated code |
| `tests/` | Test files |

## Traceability

Artifacts link to each other using references:

```markdown
# Technical Design: User Registration

## Source
- Intent: user-authentication
- Unit: user-registration  
- Story: US-001

## Related ADRs
- [ADR-001: Password Hashing Algorithm](./adr-001.md)

## Implementation
- [src/auth/registration.ts](../../src/auth/registration.ts)
```

## Agent Interaction

1. **Context Loading** — Agent reads relevant artifacts at session start
2. **Work Execution** — Agent generates new artifacts during work
3. **Artifact Storage** — Agent writes artifacts to Memory Bank
4. **Reference Linking** — Agent updates cross-references

## Version Control

The Memory Bank is designed for Git:

```bash
# Track all artifacts
git add memory-bank/

# Meaningful commit messages
git commit -m "feat(auth): Complete user registration bolt"

# Review changes in PRs
git diff memory-bank/intents/auth/
```

> Commit Memory Bank changes along with code changes. This maintains the connection between decisions and implementation.

## Best Practices

- **Keep Artifacts Current** — Update artifacts when decisions change. Stale documentation is worse than no documentation.
- **Use Consistent Formatting** — Follow the templates. Consistent structure helps agents parse content.
- **Link Generously** — Cross-reference related artifacts. Traceability prevents knowledge silos.
- **Version with Code** — Commit Memory Bank changes with related code. They belong together.
