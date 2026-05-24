# Technical PRD: {PRODUCT_NAME}

> **Version**: {VERSION} | **Author**: {AUTHOR} | **Date**: {DATE} | **Status**: {STATUS}

---

## 1. Product Overview

### 1.1 Problem Statement

{Describe the problem this product/feature solves. Who experiences it? How severe is it? What is the current workaround, if any?}

### 1.2 Vision

{One-paragraph vision of what this product/feature will become. Paint the picture of the ideal end state.}

### 1.3 Scope

| In Scope | Out of Scope |
|----------|-------------|
| {item}   | {item}      |

---

## 2. Goals & Success Metrics

### 2.1 Goals

| # | Goal | Type |
|---|------|------|
| G1 | {goal} | Business / Technical / User Experience |
| G2 | {goal} | Business / Technical / User Experience |

### 2.2 Success Metrics

| Metric | Current Baseline | Target | Measurement Method | Timeline |
|--------|-----------------|--------|-------------------|----------|
| {metric} | {baseline} | {target} | {how measured} | {when} |

### 2.3 Non-Goals

- {What this product explicitly does NOT aim to achieve}

---

## 3. User Personas & Use Cases

### 3.1 Personas

#### Persona: {NAME}

- **Role**: {role}
- **Technical Level**: {Beginner / Intermediate / Advanced}
- **Pain Points**: {what frustrates them}
- **Goals**: {what they want to achieve}

### 3.2 Use Cases

#### UC-{N}: {Title}

- **Actor**: {persona}
- **Precondition**: {what must be true before}
- **Trigger**: {what initiates this use case}
- **Main Flow**:
  1. {step}
  2. {step}
  3. {step}
- **Postcondition**: {what is true after success}
- **Alternative Flows**: {edge cases, error paths}

---

## 4. Functional Requirements

### 4.1 Requirements Table

| ID | Requirement | Priority | Acceptance Criteria |
|----|------------|----------|-------------------|
| FR-001 | {requirement} | Must / Should / Could | {measurable criteria} |
| FR-002 | {requirement} | Must / Should / Could | {measurable criteria} |

### 4.2 User Stories

#### {EPIC_NAME}

- **US-001**: As a {persona}, I want to {action} so that {benefit}.
  - AC: Given {context}, when {action}, then {outcome}.

---

## 5. Non-Functional Requirements

### 5.1 Performance

| Metric | Requirement | Measurement |
|--------|------------|-------------|
| Response Time | {e.g., p95 < 200ms} | {tool/method} |
| Throughput | {e.g., 1000 req/s} | {tool/method} |
| Resource Usage | {e.g., < 512MB RAM} | {tool/method} |

### 5.2 Scalability

- **Horizontal**: {how the system scales out}
- **Vertical**: {growth limits and thresholds}
- **Data Volume**: {expected data growth over time}

### 5.3 Reliability & Availability

- **Uptime Target**: {e.g., 99.9%}
- **Recovery Time Objective (RTO)**: {time}
- **Recovery Point Objective (RPO)**: {data loss tolerance}
- **Failure Modes**: {what happens when X fails}

### 5.4 Observability

- **Logging**: {what is logged, format, retention}
- **Metrics**: {key metrics to track}
- **Alerting**: {critical alerts and thresholds}
- **Tracing**: {distributed tracing approach}

---

## 6. System Architecture

### 6.1 High-Level Architecture

{Describe the overall architecture. Include a diagram reference or ASCII diagram.}

```
[Component A] --> [Component B] --> [Component C]
      |                                   |
      v                                   v
  [Database]                        [External API]
```

### 6.2 Component Breakdown

| Component | Responsibility | Technology | Owner |
|-----------|---------------|------------|-------|
| {name} | {what it does} | {tech stack} | {team/person} |

### 6.3 Data Model

{Key entities and their relationships. Include ERD reference if available.}

| Entity | Key Attributes | Relationships |
|--------|---------------|---------------|
| {entity} | {attributes} | {relations} |

### 6.4 Data Flow

{Describe how data moves through the system for the primary use cases.}

---

## 7. API & Interface Contracts

### 7.1 API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| {GET/POST/...} | {/path} | {what it does} | {auth type} |

### 7.2 Request/Response Schemas

#### {Endpoint Name}

**Request:**
```json
{
  "field": "type — description"
}
```

**Response:**
```json
{
  "field": "type — description"
}
```

### 7.3 Error Codes

| Code | Meaning | Resolution |
|------|---------|------------|
| {code} | {description} | {what the client should do} |

---

## 8. Dependencies & Integrations

### 8.1 Internal Dependencies

| Dependency | Type | Impact if Unavailable | Owner |
|-----------|------|----------------------|-------|
| {service/lib} | {sync/async/library} | {degraded/blocked/fallback} | {team} |

### 8.2 External Dependencies

| Dependency | Purpose | SLA | Fallback Strategy |
|-----------|---------|-----|-------------------|
| {service} | {why needed} | {uptime/latency} | {what happens if down} |

### 8.3 Migration Requirements

{Any data migrations, API version transitions, or backwards-compatibility needs.}

---

## 9. Security & Compliance

### 9.1 Authentication & Authorization

- **Auth Method**: {OAuth2 / JWT / API Key / mTLS / etc.}
- **Authorization Model**: {RBAC / ABAC / ACL}
- **Roles & Permissions**:

| Role | Permissions |
|------|------------|
| {role} | {what they can do} |

### 9.2 Data Security

- **Data Classification**: {public / internal / confidential / restricted}
- **Encryption at Rest**: {yes/no — method}
- **Encryption in Transit**: {TLS version, certificate management}
- **PII Handling**: {what PII exists, how it's protected}

### 9.3 Compliance Requirements

| Regulation | Requirement | How Addressed |
|-----------|------------|---------------|
| {GDPR/SOC2/HIPAA/...} | {specific requirement} | {implementation} |

---

## 10. Risks & Mitigations

| # | Risk | Probability | Impact | Mitigation | Owner |
|---|------|-------------|--------|------------|-------|
| R1 | {risk description} | High/Med/Low | High/Med/Low | {mitigation plan} | {who} |

---

## 11. Timeline & Milestones

### 11.1 Phases

| Phase | Deliverables | Target Date | Dependencies |
|-------|-------------|-------------|--------------|
| Phase 1: {name} | {what ships} | {date} | {blockers} |
| Phase 2: {name} | {what ships} | {date} | {blockers} |

### 11.2 Release Strategy

- **Rollout Method**: {Big bang / Canary / Blue-Green / Feature Flag}
- **Rollback Plan**: {how to revert if issues arise}
- **Feature Flags**: {flags needed and their lifecycle}

---

## 12. Open Questions & Assumptions

### 12.1 Open Questions

| # | Question | Owner | Due Date | Decision |
|---|---------|-------|----------|----------|
| Q1 | {question} | {who decides} | {when} | {pending/resolved: answer} |

### 12.2 Assumptions

| # | Assumption | Risk if Wrong | Validation Plan |
|---|-----------|---------------|-----------------|
| A1 | {assumption} | {consequence} | {how to verify} |

---

## Appendix

### A. Glossary

| Term | Definition |
|------|-----------|
| {term} | {definition} |

### B. References

- {Link to related documents, RFCs, ADRs, design docs}

### C. Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| {ver} | {date} | {who} | {what changed} |
