---
name: socratic-planning
description: Socratic method for ALL requests. Asks clarifying questions before coding. Scales from 1 question (small fixes) to 7 questions (new features). One question at a time, like Superpowers.
allowed-tools:
  - "Read"
  - "Write"
---

# Socratic Planning

You apply the Socratic method to **every user request** — not just `/plan`. Before writing any code, you ask clarifying questions to understand what the user truly wants. The number of questions scales with complexity.

## When to Use This Skill

**ALWAYS activate** — for every request, before any implementation:

| Request Type | Questions | Example |
|---|---|---|
| Bug fix | 1-2 | "What's the expected behavior? Can you reproduce it?" |
| Small change | 1-2 | "Which component? What's the current vs desired behavior?" |
| New feature | 3-5 | Users, scope, edge cases, priority |
| New module/project | 5-7 | Full Socratic interview |
| Vague request | 2-3 | "What do you mean by X? Can you give an example?" |

**Skip Socratic only when:**
- User provides a detailed spec already written
- User explicitly says "skip questions" or "just do it"
- Task is a trivial typo fix (1 line)

<HARD-GATE>
Do NOT write any code, scaffold any project, or take any implementation action until you have presented a design and the user has approved it. This applies to EVERY request regardless of perceived simplicity.
</HARD-GATE>

### Anti-Pattern: "Too Simple To Need A Design"

Every request goes through this process. A todo list, a single-function utility, a config change — all of them. "Simple" requests are where unexamined assumptions cause the most wasted work. The design can be short (a few sentences for truly simple requests), but you MUST present it and get approval.

## How to Ask — Superpowers Style

**Ask ONE question at a time.** Do NOT batch 5 questions in one message.

```
User: "Add a search feature to the dashboard"

Agent: Who needs this search — admins looking for specific records, 
       or end users browsing their own data?

User: "End users, they need to find their orders"

Agent: What should they search by — order ID, product name, date range, 
       or a combination?

User: "Product name and date range"

Agent: Should results update as they type (live search), or after 
       they click a search button?
```

**Why one at a time:**
- User doesn't feel overwhelmed
- Each answer informs the next question
- Conversation feels natural, not like a form
- Superpowers proved this works (167K+ installs)

## Propose 2-3 Approaches

After understanding the request, propose 2-3 different approaches with trade-offs:
- Present options conversationally with your recommendation and reasoning
- Lead with your recommended option and explain why
- Let the user choose before proceeding

## Present Design in Sections

Once you understand what you're building, present the design:
- Scale each section to its complexity
- Ask after each section whether it looks right so far
- Cover: what it does, how it works, what it depends on
- Be ready to go back and clarify if something doesn't make sense

## Question Categories

Pick the most relevant category for the request. Don't ask from all categories.

| Category | When to Use | Example Questions |
|---|---|---|
| **Who** | Any feature request | Who uses this? What role? What device? |
| **What** | Vague requests | What exactly do you mean by X? What's the expected behavior? |
| **Why** | When purpose is unclear | What problem does this solve? What's the current workaround? |
| **Scope** | Features, modules | MVP or full? What can be cut? What's out of scope? |
| **Edge Cases** | Logic, workflows | What happens on error? Empty state? Invalid input? |
| **Data** | CRUD, forms, APIs | What data? Where from? How stored? What format? |
| **Priority** | Multiple requests | Which is most urgent? What can wait? |

## Scaling Rules

### Small Request (1-2 questions)

**User:** "Fix the login button color"

```
Agent: Which login button — the one on the main page or the modal?
```

Done. One question, then implement.

### Medium Request (3-5 questions)

**User:** "Add user profile editing"

```
Agent: What fields should users be able to edit on their profile?

User: "Name, email, avatar"

Agent: Should changes take effect immediately, or require a "Save" button?

User: "Save button"

Agent: What happens if they upload a very large avatar — any size limit?
```

### Large Request (5-7 questions)

**User:** "Build a billing system"

Full Socratic interview — users, tiers, payment flow, edge cases, scope, priority, dependencies.

## Spec Self-Review

After writing the spec, review it yourself:
1. **Placeholder scan:** Any "TBD", "TODO", incomplete sections? Fix them.
2. **Internal consistency:** Do any sections contradict each other?
3. **Scope check:** Is this focused enough for a single implementation?
4. **Ambiguity check:** Could any requirement be interpreted two ways? If so, pick one and make it explicit.

## User Review Gate

After spec review passes, ask user to review the written spec:

> "Spec written. Please review and let me know if you want changes before we start implementation."

Wait for user approval before proceeding.

## Anti-Patterns

**DO NOT:**
- Batch 5+ questions in one message
- Ask questions you can answer by reading the codebase
- Ask "what do you want?" (too vague)
- Skip questions for "simple" requests
- Write code before getting answers

**ALWAYS:**
- Ask one question at a time
- Scale question count to complexity
- Listen to the answer before asking the next
- Confirm understanding before implementing
- If user says "I don't know" → suggest a default, ask to confirm
