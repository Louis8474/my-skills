# ADR Markdown Template

Use this exact structure. Replace every placeholder with real content.

```markdown
# [Title]

| Field | Value |
|-------|-------|
| **Status** | [Proposed / In Progress / Accepted / Deprecated] |
| **Responsible** | [Person responsible for driving the decision] |
| **Accountable** | [Person ultimately accountable for the outcome] |
| **Consulted** | [Security / Platform / Quality Engineer / Architect / ...] |
| **Informed** | [Other colleagues who might benefit from awareness of this decision] |
| **Outcome** | [One-line summary of what was decided] |
| **Due date** | [YYYY-MM-DD] |
| **Vertical** | [Business vertical affected] |
| **Team** | [Team owning this decision] |

## Background

[What details are important in making this decision? Describe the situation, constraints, and forces that require a choice. Focus on the problem, not the solution.]

## Options Considered

Elaborate the options available and include the pros & cons of each.

### Option 1: [Name]

[Brief description.]

**Pros:**
- [Advantage 1]
- [Advantage 2]

**Cons:**
- [Drawback 1]
- [Drawback 2]

### Option 2: [Name]

[Brief description.]

**Pros:**
- [Advantage 1]

**Cons:**
- [Drawback 1]

### Option 3: [Name]

[Brief description.]

**Pros:**
- [Advantage 1]

**Cons:**
- [Drawback 1]

## Decision Outcome

Chosen option: **"[Option Name]"**, because [justification — e.g., only option which meets the key criterion | resolves the main constraint | comes out best when weighing pros and cons].

[Include all the necessary context on why the option selected is better than the rest.]

## Consequences

[Positive & negative consequences of the option selected. Follow-up actions required, etc.]

## Action items

- [ ] [Task] — @[assignee]
- [ ] [Task] — @[assignee]
```

## Notes

- Option 3 is optional — remove it if only two options were considered.
- Action items are follow-up tasks spawned by the decision. Omit this section if there are none.
- Keep Background focused on the problem, not the solution.
