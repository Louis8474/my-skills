---
title: Compare Spec-Driven Tools
description: How specs.md compares to Spec Kit, BMAD, Kiro, and OpenSpec
---

## specs.md: One Framework, Three Flows

| Flow | Checkpoints | Optimized For |
|------|-------------|---------------|
| **Simple** | 3 (phase gates) | Spec generation only, quick prototypes |
| **FIRE** | Adaptive | Adaptive execution, brownfield, monorepos |
| **AI-DLC** | Comprehensive | Full traceability, regulated environments |

## Comparison Matrix

| Feature | specs.md | Spec Kit | BMAD | OpenSpec | Kiro |
|---------|----------|----------|------|----------|------|
| **Type** | Methodology + Framework | Toolkit + Agent Prompts | Multi-agent Framework | Lightweight Framework | Full IDE |
| **Methodology** | AWS AI-DLC (formal) | Spec Kit SDD | Agentic Agile | OpenSpec SDD | Kiro SDD |
| **Design Integration** | DDD default | Constitution file | Optional | Design-agnostic | Design-agnostic |
| **Phases** | 3 sequential | 6 sequential | 4 phases | Change-centric | Req → Design → Tasks |
| **Agent Model** | 3 phase-based agents | Prompts for 15+ assistants | 19 role-based agents | AGENTS.md compatible | Built-in + Subagents |
| **Iteration Cycles** | Hours/days (Bolts) | Variable | Variable | Variable | Variable |
| **Brownfield Support** | Yes | Yes | Yes | Yes (primary focus) | Yes |
| **IDE Lock-in** | None | None | None | None | Kiro IDE only |
| **Open Source** | Yes | Yes | Yes | Yes | Partial |
| **Pricing** | Free + API tokens | Free + API tokens | Free + API tokens | Free + API tokens | $20-200/mo |

## Key Differentiators

### 1. AI-DLC is a Formal AWS Methodology
Unlike generic "spec-driven development," AI-DLC is defined by AWS with specific phases, rituals, and artifacts. specs.md is a faithful implementation—not an interpretation.

### 2. DDD as Default, Extensible via Bolt Types
Agile frameworks leave design techniques optional. AI-DLC integrates Domain-Driven Design as its default. Use bolt types to add other methodologies like BDD, TDD, or custom flows.

### 3. Bolts: Batched Stories with Full Traceability
specs.md uses **Bolts**—planned batches of related stories executed together by an agent. Each Bolt follows DDD steps during execution, and artifacts provide full traceability.

### 4. Reversed Conversation Direction
In AI-DLC, **AI initiates and directs conversations**. AI proposes breakdown, trade-offs, designs. Humans validate and approve.

### 5. Mob Rituals for Team Alignment
Mob Elaboration (Inception) and Mob Construction condense weeks of sequential work into hours while achieving deep alignment between team and AI.

---

## vs GitHub Spec Kit

**Spec Kit** is a toolkit with agent prompts and 7 slash commands for 15+ AI assistants. **specs.md** is a full methodology implementation.

| Aspect | specs.md | Spec Kit |
|--------|----------|----------|
| **Type** | Full methodology | Toolkit + Agent Prompts |
| **Target** | Complex systems | Small-medium projects |
| **Design** | DDD default | Constitution file |
| **Rituals** | Mob Elaboration, Mob Construction | None |
| **Learning Curve** | Moderate | Low |

**Choose Spec Kit if:** You want minimal workflow change and lowest learning curve.

**Choose specs.md if:** You need DDD integration, Mob rituals, multi-team coordination, or a proven AWS methodology.

---

## vs BMAD-Method

Both target complex systems. **BMAD** uses 19+ role-based agents simulating a full development team. **specs.md** uses 3 phase-based agents aligned to AI-DLC methodology.

| Aspect | specs.md | BMAD |
|--------|----------|------|
| **Origin** | AWS formal methodology | Community-driven framework |
| **Agents** | 3 phase-based (Master, Inception, Construction, Operations) | 19+ role-based (Analyst, PM, Architect, Dev, QA, etc.) |
| **Design** | DDD integrated as core | Optional, team choice |
| **Rituals** | Mob Elaboration, Mob Construction (collocated) | Agent handoffs (async) |
| **Complexity** | Moderate | High |

**Choose BMAD if:** You want maximum agent customization and role-based simulation.

**Choose specs.md if:** You prefer fewer phase-aligned agents, DDD as integral, collocated Mob rituals, and a formal AWS methodology.

---

## vs Kiro (AWS)

**Kiro** is AWS's agentic IDE with integrated spec-driven development. **specs.md** is IDE-agnostic, working with 11+ AI coding tools.

| Aspect | specs.md | Kiro |
|--------|----------|------|
| **Type** | Framework/CLI | Full IDE |
| **IDE** | Any (Cursor, VS Code, Claude Code, etc.) | Kiro IDE only |
| **AI Model** | Any (Claude, GPT, Gemini, etc.) | Claude Sonnet only |
| **Pricing** | Free + API tokens | $20-200/mo |
| **Lock-in** | None | Kiro IDE + Claude only |

**Kiro's unique features:** EARS notation, Agent Hooks (event-driven automations), MCP Integration, AWS Powers.

**specs.md unique features:** Mob Rituals, DDD as Core, Phase-Based Agents, Bolts, IDE Freedom.

**Choose Kiro if:** You want an all-in-one IDE experience with deep AWS integration.

**Choose specs.md if:** You want IDE flexibility, AI model choice, no subscription costs, or formal methodology depth.

---

## vs OpenSpec

**OpenSpec** is a lightweight, brownfield-first CLI tool focused on change management. **specs.md** is a full lifecycle methodology.

| Aspect | specs.md | OpenSpec |
|--------|----------|----------|
| **Primary Focus** | Full lifecycle (Inception → Operations) | Change management |
| **Structure** | Intents → Units → Stories | Specs + Changes separation |
| **Brownfield** | Supported (with model elevation) | Excellent (primary design focus) |
| **Token Efficiency** | Units scope context | Spec deltas |
| **Learning Curve** | Moderate | Low |

**OpenSpec structure:**
```
openspec/
├── specs/      # Current truth (what exists)
└── changes/    # Proposed updates (what's changing)
```

**specs.md structure:**
```
memory-bank/
├── intents/           # High-level goals
├── units/             # Decomposed work
├── construction/      # Domain models, code
└── operations/        # Deployment, monitoring
```

**Choose OpenSpec if:** You primarily make incremental changes to existing codebases with minimal overhead.

**Choose specs.md if:** You need full project lifecycle support, greenfield development, DDD integration, or multi-team coordination.

---

## Use Case Summary

| Use Case | Best Tool |
|----------|-----------|
| Quick spec generation | Spec Kit or specs.md (Simple Flow) |
| Small bug fix | OpenSpec |
| Complex system development | specs.md |
| Team coordination | specs.md |
| Enterprise/regulated environments | specs.md |
| DDD integration | specs.md |
| High-volume small changes | OpenSpec |
| Maximum agent customization | BMAD |
| All-in-one IDE | Kiro |
| Free/open source | specs.md, Spec Kit, BMAD, OpenSpec |
