---
title: Choosing Bolt Types
description: A practical guide to selecting the right bolt type for your work
---

## Overview

The AI-DLC flow provides two bolt types, each optimized for different types of work. Choosing the right bolt type ensures the appropriate level of rigor and structure.

## Quick Decision Guide

> The Inception Agent automatically selects the appropriate bolt type. You can change it during human checkpoint review.

1. **Does it involve complex business logic or domain rules?**
   - **Yes** → Use **DDD Construction Bolt**
   - **No** → Continue to next question

2. **Is it UI, integration, utility, or straightforward CRUD?**
   - **Yes** → Use **Simple Construction Bolt**

---

## DDD Construction Bolt

**Use for:** Complex domain logic requiring careful modeling and design decisions.

### Best For

- Core business logic with complex rules
- Domain models with aggregates, entities, and value objects
- Services that encode business knowledge
- Features where incorrect logic has significant consequences
- Bounded contexts with rich domain models

### Stages

| Stage | Purpose | Output |
|-------|---------|--------|
| **1. Domain Model** | Model business logic using DDD principles | Domain model document |
| **2. Technical Design** | Apply patterns, define interfaces | Technical design document |
| **3. ADR Analysis** | Document significant decisions | Architecture Decision Record |
| **4. Implement** | Generate production code | Implementation |
| **5. Test** | Verify correctness | Test suite |

### Example Use Cases

- **E-commerce Order Processing** — Complex state transitions, pricing rules, inventory, payments
- **Financial Calculations** — Interest, fees, compliance rules
- **Booking Systems** — Availability rules, conflict detection, reservations
- **Workflow Engines** — State machines, transition rules, approval chains

---

## Simple Construction Bolt

**Use for:** Straightforward implementations that don't require extensive domain modeling.

### Best For

- Frontend pages and components
- Simple CRUD endpoints
- External API integrations
- Utilities and helper modules
- CLI commands and scripts
- Configuration and setup code

### Stages

| Stage | Purpose | Output |
|-------|---------|--------|
| **1. Plan** | Define what to build | `implementation-plan.md` |
| **2. Implement** | Write the code | Source code + `implementation-walkthrough.md` |
| **3. Test** | Verify the implementation | Tests + `test-walkthrough.md` |

### Example Use Cases

- **User Profile Page** — React component, clear requirements, no complex logic
- **REST API Integration** — Third-party API with documented endpoints
- **Admin Dashboard** — Data display and basic filtering
- **CLI Tool** — Command-line utility with clear inputs/outputs

---

## Comparison Table

| Aspect | DDD Construction | Simple Construction |
|--------|------------------|---------------------|
| **Stages** | 5 | 3 |
| **Duration** | Hours to days | Hours |
| **Documentation** | Extensive | Light |
| **Design Rigor** | High | Low |
| **Human Reviews** | 5 checkpoint reviews | 3 checkpoint reviews |

## Common Mistakes

### Over-Engineering (DDD for Simple Tasks)

**Symptom:** Using DDD Construction for a simple settings page.

**Problem:** Excessive ceremony for straightforward work.

**Solution:** Use Simple Construction for UI, utilities, and integrations.

### Under-Engineering (Simple for Complex Tasks)

**Symptom:** Using Simple Construction for complex pricing logic.

**Problem:** Skipping domain modeling leads to implicit business rules scattered in code.

**Solution:** Use DDD Construction when business logic is non-trivial.
