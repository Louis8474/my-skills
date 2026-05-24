---
name: service-boundary-analysis
description: "Trigger: service boundary analysis, microservice inputs/outputs, API/consumer/output mapping. Inspect backend service boundaries with evidence and confidence."
license: MIT
metadata:
  author: andresnator
  version: "1.0.0"
---

# Skill: service-boundary-analysis

## Activation Contract

Use this skill when asked to inspect a backend service, microservice, worker, or API repository to identify what enters the service and what the service sends, writes, publishes, schedules, or otherwise emits.

Do **not** use this skill for runtime tracing, code modification, full architecture design, security review, database schema design, or claiming complete certainty for dynamic framework behavior.

## Responsibility

This skill teaches read-only, multilingual, heuristic service-boundary inspection. It defines boundary categories, discovery heuristics, evidence requirements, confidence scoring, and the required report shape.

It does not decide whether to run a separate agent, coordinate multi-phase work, execute the analyzed application, install dependencies, edit source code, or replace human review.

## Required Context

- Target repository, directory, file list, or code excerpts to inspect.
- User's requested scope, such as one service, module, bounded context, or selected paths.
- Any known language/framework context supplied by the user or visible from files.
- Any exclusions, such as generated files, vendored code, fixtures, or migrations.

## Context Budget

- Keep the inspection report focused on boundary evidence, confidence, and limitations.
- Prefer compact excerpts over large pasted source blocks.
- Group repeated equivalent findings when they share the same mechanism and destination.

## Hard Rules

- Inspect read-only. Do not edit code, create files in the analyzed repository, run the service, install dependencies, or execute tests/builds as part of this skill.
- Every finding in `Inputs` and `Outputs` MUST include category, mechanism, source/destination, file, line/range, symbol, confidence, evidence, discovery method, and notes.
- Use `unavailable` when line/range or symbol cannot be derived; never omit the field.
- Include exactly one `Inputs` table and exactly one `Outputs` table in the final report.
- Include uncertain findings, not-found categories, and limitations explicitly.
- Never upgrade confidence without evidence. Dynamic reflection, generated wiring, missing config, or unresolved indirection MUST be called out.

## Boundary Taxonomy

### Inputs

Classify service entrypoints into these categories:

- HTTP/API
- RPC
- messaging consumers
- stream consumers
- WebSocket/SSE
- scheduled jobs
- CLI/batch/worker entrypoints
- file/object triggers
- config loading

### Outputs

Classify service egress and side effects into these categories:

- database writes
- external service calls
- event publishing
- cache writes/invalidations
- filesystem/object writes
- search/index writes
- embeddings/vector writes
- notification dispatch
- job scheduling
- scoped observability emissions

`scoped observability emissions` means boundary-relevant metrics, traces, audit events, logs, or telemetry that leave the process or are intentionally consumed outside the service. Do not list incidental local debug logging unless it is configured as a boundary signal.

## Heuristic Signals

Combine multiple signals before classifying a finding:

- Path and filename cues: `controllers`, `routes`, `handlers`, `listeners`, `consumers`, `jobs`, `workers`, `clients`, `repositories`, `publishers`, `schedulers`, `config`.
- Annotation/decorator cues: route mappings, queue listeners, scheduled job decorators, RPC handlers, event handlers, CLI commands.
- Registration cues: router setup, dependency injection bindings, framework modules, handler maps, consumer registration, cron registration.
- Client/SDK cues: HTTP clients, database clients, queue clients, cache clients, notification SDKs, search/vector clients, object storage SDKs.
- Method-name cues: `post`, `put`, `patch`, `delete`, `save`, `insert`, `update`, `publish`, `send`, `emit`, `enqueue`, `schedule`, `set`, `invalidate`, `index`, `upsert`.
- Configuration cues: endpoint URLs, topic/queue names, cron expressions, bucket names, database/cache/search connection settings.
- Cross-file wiring: a route or consumer declaration in one file connected to a handler or client call in another.

Common frameworks/languages include but are not limited to Java/Spring, Kotlin, Node/Express/Nest/Fastify, Python/FastAPI/Django/Flask/Celery, Go net/http/Gin/Chi, Ruby/Rails, C# ASP.NET, PHP/Laravel/Symfony, Kafka/Rabbit/SQS/PubSub consumers, and cron/scheduler libraries.

## Confidence Rubric

| Confidence | Use when | Examples |
|---|---|---|
| `high` | Direct code evidence identifies both the boundary mechanism and the source/destination. | `@PostMapping("/orders")`; `kafkaTemplate.send("orders.created", ...)`; `redis.set(...)`. |
| `medium` | Evidence is indirect but supported by framework conventions, registration, or cross-file wiring. | Handler registered by module wiring; queue name loaded from config and referenced by consumer setup. |
| `low` | Finding is plausible but incomplete, inferred mainly by names/conventions, or blocked by dynamic/runtime wiring. | `OrderPublisher` without visible topic; reflection-generated route; destination hidden in unavailable config. |

Confidence reasons belong in `notes`. If evidence is insufficient to classify, keep the item in `Uncertain Findings` instead of forcing it into a high-confidence category.

## Decision Gates

| Condition | Action |
|---|---|
| Target scope is missing | Ask one blocking question for the repository/path/module to inspect. |
| User asks to modify or run the service | Refuse that part and continue only with read-only static inspection if enough context exists. |
| Evidence identifies a boundary directly | Add it to the relevant table with `high` confidence. |
| Evidence is indirect but corroborated | Add it with `medium` confidence and explain the inference. |
| Evidence is ambiguous or incomplete | Add it to `Uncertain Findings` or table it with `low` confidence and explain why. |
| Category has no evidence in inspected scope | List it under `Not-Found Categories`. |

## Execution Steps

1. Confirm the target scope and any exclusions.
2. Identify language/framework signals from manifests, directory names, and source files.
3. Search likely input surfaces: routes/controllers, RPC handlers, consumers/listeners, streams, WebSocket/SSE handlers, schedulers, CLI/worker entrypoints, file/object hooks, and config loading.
4. Search likely output surfaces: repositories/ORM writes, external clients, publishers, caches, file/object writes, search/vector writes, notifications, job schedulers, and boundary-relevant observability.
5. For each candidate, capture concise evidence: file, line/range when available, symbol when available, code/config excerpt, and discovery method.
6. Classify using the taxonomy and confidence rubric.
7. Preserve uncertainty; do not erase low-confidence signals just because they are incomplete.
8. Produce the required report with exactly one `Inputs` table and one `Outputs` table, then add uncertainty, not-found categories, and limitations.

## Output Contract

Return a Markdown report with this structure:

```markdown
# Service Boundary Analysis Report

## Scope
<target, files/paths reviewed, exclusions>

## Inputs
| category | mechanism | source/destination | file | line/range | symbol | confidence | evidence | discovery method | notes |
|---|---|---|---|---|---|---|---|---|---|

## Outputs
| category | mechanism | source/destination | file | line/range | symbol | confidence | evidence | discovery method | notes |
|---|---|---|---|---|---|---|---|---|---|

## Uncertain Findings
- <finding, evidence, why confidence is limited>

## Not-Found Categories
- Inputs: <categories not found in inspected scope>
- Outputs: <categories not found in inspected scope>

## Limitations
- <dynamic wiring, missing config, generated code, uninspected paths, or other limits>
```

The `Inputs` and `Outputs` tables are mandatory even when no findings are found. If empty, include one row with `none found` in `category`, `unavailable` for unavailable fields, `low` confidence, and notes explaining the inspected scope.

## Validation Scenarios

| Scenario | Expected behavior | Must not do |
|---|---|---|
| HTTP route and DB write | Classifies the route as `HTTP/API` input and the write as `database writes` output with evidence. | Claim unrelated consumers exist. |
| Queue listener and event publishing | Classifies listener as `messaging consumers` input and publisher as `event publishing` output. | Hide topic/queue uncertainty. |
| Scheduled cache refresh | Classifies scheduler as `scheduled jobs` input and cache operation as `cache writes/invalidations` output. | Treat local helper calls as external service calls. |
| Dynamic routing | Records uncertain or low-confidence finding with limitations. | Mark dynamic inference as `high`. |
| Missing category evidence | Lists absent categories under `Not-Found Categories`. | Omit unsupported categories silently. |

## References

None.

## Assets

None.
