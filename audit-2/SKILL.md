---
name: audit
description: Performs structured code, security, and architecture audits. Produces severity-categorized findings with file/line evidence and actionable remediation steps. Use when reviewing a PR, conducting a security review, evaluating technical debt, or assessing code quality before a release. Never merge critical audit findings without a documented resolution.
---

# Audit Engineering

## Purpose
Auditing is the quality gate that catches what the executor misses. It exists to provide an independent, systematic review of the codebase - not a casual read-through, but a structured analysis against a predefined checklist. The output is a finding report that can be actioned, not a vague list of "things to improve."

## SOP: Code and Security Audit

### Step 1 - Audit Scope Definition
Ask before beginning:
1. What is the scope? (Single file, a PR diff, an entire module, the full codebase?)
2. What type of audit? (Security, performance, code quality, architecture, or all four?)
3. Is there a specific concern that triggered this audit?

A scoped audit is more useful than a comprehensive one that produces 50 findings nobody will act on.

### Step 2 - Severity Taxonomy
Every finding must be categorized. Use this scale consistently:

| Severity | Definition | SLA to Fix |
|---|---|---|
| Critical | Can be exploited immediately; data breach or system compromise risk | Before next deploy |
| High | Significant functional or security flaw; likely to cause production incident | Within 1 sprint |
| Medium | Code quality, maintainability, or minor security hardening issue | Within 2 sprints |
| Low | Stylistic issue, minor improvement, or best practice deviation | Backlog |
| Info | Observation with no immediate action required | Record only |

Never skip severity assignment. "This is bad" is not actionable. "This is Critical because..." is.

### Step 3 - Security Audit Checklist (FastAPI + Next.js)
Walk through each check and log findings:

**Authentication and Authorization:**
- [ ] Every non-public route has `Depends(get_current_user)` or session check.
- [ ] Service-layer functions check `current_user.id == resource.user_id` before returning data.
- [ ] JWT expiry is enforced; tokens expire within 15-60 minutes.

**Input Handling:**
- [ ] All external inputs pass through Pydantic validators or Zod schemas.
- [ ] No raw f-string SQL construction anywhere in the codebase (`grep -r "f\"" -- "*.py"` and check for SQL patterns).
- [ ] File uploads validate MIME type and size server-side (not just client-side).

**Secrets:**
- [ ] `git log -p | grep -i "password\|secret\|key\|token"` - no secrets in git history.
- [ ] `.env` is in `.gitignore`.
- [ ] No hardcoded API keys or connection strings in source files.

**Dependencies:**
- [ ] `pip-audit` or `safety check` passes with no known CVEs.
- [ ] `npm audit` passes with 0 critical or high vulnerabilities.

### Step 4 - Code Quality Checklist

**Complexity:**
- [ ] No function exceeds 40 lines. Extract helpers if needed.
- [ ] No function has more than 4 levels of nesting. Flatten with early returns.
- [ ] Cyclomatic complexity: `ruff check --select C901 src/`.

**Test Coverage:**
- [ ] `pytest --cov=src --cov-report=term-missing` - identify untested files.
- [ ] Critical paths (auth, payment, data deletion) have explicit test coverage.
- [ ] No known failing tests are being skipped with `@pytest.mark.skip`.

**Duplication:**
- [ ] No copy-pasted logic between files. Common patterns extracted to utilities.

### Step 5 - Finding Evidence Format
Every finding must cite specific evidence:

```
[Severity] Finding: [Short title]
File: src/api/v1/orders.py, Line 47
Code: `order = await db.execute(f"SELECT * FROM orders WHERE id = '{order_id}'")`
Risk: SQL injection via unsanitized `order_id` parameter. An attacker can pass `' OR '1'='1` to exfiltrate all orders.
Remediation: Replace with ORM query: `await db.execute(select(Order).where(Order.id == order_id))`.
```

No finding is valid without a `File:` and `Code:` cite. "The auth looks weak" is not a finding.

### Step 6 - Audit Report Output Format
```markdown
# Audit Report: [Scope] - [Date]

## Summary
| Severity | Count |
|---|---|
| Critical | 1 |
| High | 2 |
| Medium | 5 |
| Low | 8 |
| Info | 3 |

## Critical Findings
[Finding detail as per Step 5 format]

## High Findings
...

## Remediation Checklist
- [ ] [File:Line] Fix SQL injection in orders endpoint
- [ ] [File:Line] Add row-level authorization to GET /invoices/{id}
```
