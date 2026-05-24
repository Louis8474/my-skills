---
title: Standards
description: Project decisions that inform AI code generation
---

## What are Standards?

**Standards** are project decisions that inform AI code generation. They ensure consistency across all generated code and documentation.

Standards are established during project initialization and guide every agent interaction. They're the "rules of the road" for your project.

## Standard Types

- **Tech Stack** — Languages, frameworks, databases, infrastructure
- **Coding Standards** — Formatting, linting, naming, testing strategy
- **Architecture** — Architecture style, API design, state management
- **UX Guide** — Design system, styling, accessibility

## Establishing Standards

During project initialization:

```
/specsmd-master-agent
> project-init
```

The Master Agent guides you through each standard category with facilitation guides.

## Tech Stack Standard

Defines your technology choices:

```markdown
# Tech Stack

## Languages
- **Primary**: TypeScript 5.x
- **Secondary**: Python 3.11+ (for ML pipelines)

## Frontend
- **Framework**: React 18 with Next.js 14
- **Styling**: Tailwind CSS
- **State**: Zustand

## Backend
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js
- **ORM**: Prisma

## Database
- **Primary**: PostgreSQL 15
- **Cache**: Redis 7
- **Search**: Elasticsearch 8

## Infrastructure
- **Cloud**: AWS
- **Containers**: Docker
- **Orchestration**: ECS Fargate
- **CI/CD**: GitHub Actions
```

## Coding Standards

Defines how code should be written:

```markdown
# Coding Standards

## Formatting
- Use Prettier with default config
- 2-space indentation
- Single quotes for strings
- Trailing commas in multiline

## Naming Conventions
- **Files**: kebab-case (user-service.ts)
- **Classes**: PascalCase (UserService)
- **Functions**: camelCase (getUserById)
- **Constants**: SCREAMING_SNAKE_CASE (MAX_RETRIES)

## Testing Strategy
- **Unit Tests**: Vitest for business logic
- **Integration Tests**: Supertest for APIs
- **E2E Tests**: Playwright for critical paths
- **Coverage Target**: 80% minimum

## Error Handling
- Use custom error classes extending BaseError
- Always include error codes
- Log errors with structured logging
- Never expose internal errors to clients
```

## Architecture Standard

Defines system design decisions:

```markdown
# Architecture

## Style
- **Pattern**: Clean Architecture
- **API**: REST with OpenAPI 3.0
- **Communication**: Synchronous HTTP, async via SQS

## Layers
1. **Presentation**: Controllers, DTOs
2. **Application**: Use cases, services
3. **Domain**: Entities, value objects, events
4. **Infrastructure**: Repositories, external services

## API Design
- Resource-based URLs
- HTTP methods for actions
- JSON request/response bodies
- Pagination with cursor-based approach

## State Management
- Server state: React Query
- Client state: Zustand
- Form state: React Hook Form
```

## UX Guide (Optional)

Defines design system and styling:

```markdown
# UX Guide

## Design System
- Based on custom design tokens
- Component library: shadcn/ui

## Colors
- Primary: #2563eb
- Secondary: #64748b
- Success: #10b981
- Error: #ef4444

## Typography
- Headings: Inter, sans-serif
- Body: Inter, sans-serif
- Mono: JetBrains Mono

## Spacing
- Base unit: 4px
- Scale: 4, 8, 12, 16, 24, 32, 48, 64

## Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation required
- Screen reader support
- Color contrast 4.5:1 minimum
```

## How Standards Are Used

Agents reference standards when generating code:

1. **Context Loading** — Agent reads all standards from Memory Bank
2. **Decision Making** — Standards inform architecture and design choices
3. **Code Generation** — Generated code follows coding standards
4. **Validation** — Output is checked against standards

## Updating Standards

Standards can evolve. To update:

1. Edit the relevant file in `memory-bank/standards/`
2. Commit the change with clear rationale
3. Consider an ADR for significant changes
4. Inform the team

> Changing standards affects all future code generation. Major changes should be documented in an ADR and reviewed by the team.

## Standards Catalog

Standards are defined in `.specsmd/aidlc/templates/standards/catalog.yaml`. This catalog controls:
- Which standards exist and their importance
- Decisions within each standard
- Dependencies between standards
- Project type presets

```yaml
standards:
  tech-stack:
    description: Core technology choices
    facilitation: templates/standards/tech-stack.guide.md
    importance: critical
    decisions:
      - id: languages
        display_name: Languages
        importance: critical
      - id: framework
        display_name: Framework
        depends_on: [languages]

  coding-standards:
    depends_on_standards: [tech-stack]
    decisions:
      - id: formatting
      - id: testing_strategy

project_types:
  full-stack-web:
    required_standards: [tech-stack, data-stack, coding-standards]
    recommended_standards: [system-architecture, ux-guide]
```

### Extensibility

The catalog is designed for extensibility:

- **Add New Standards** — Add entries to `standards:` with facilitation guides
- **Custom Decisions** — Add decisions to existing standards
- **Project Types** — Define custom project type presets
- **Dependencies** — Control order via `depends_on_standards`

> Each standard has a facilitation guide (`.guide.md`) that defines the questions asked during `project-init`. Customize these to match your team's decision-making process.

## Best Practices

- **Be Specific** — Vague standards lead to inconsistent code. "Use good naming" is useless. "Use camelCase for functions" is clear.
- **Document Rationale** — Explain why, not just what. Future team members will thank you.
- **Keep Current** — Update standards when the team adopts new practices. Outdated standards are ignored.
- **Start Simple** — You don't need every detail on day one. Add specifics as patterns emerge.
