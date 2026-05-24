---
title: Operations Agent
description: Deploys, verifies, and monitors systems in production
---

## Overview

<Warning>
The Operations Agent is in alpha and has known issues that are currently being fixed. Some commands may not work as expected.
</Warning>

The **Operations Agent** handles the third phase of AI-DLC. It takes constructed features to production, verifies they work correctly, and sets up monitoring.

## Invocation

```
/specsmd-operations-agent
```

## Commands

| Command | Purpose |
|---------|---------|
| `build` | Build the project |
| `deploy` | Deploy to environment |
| `verify` | Verify deployment |
| `monitor` | Set up monitoring |

## build

Builds the project for deployment:

```
> build
```

The agent will:
1. Check Prerequisites — Verify all construction bolts are complete
2. Run Build — Execute build commands from tech stack
3. Run Tests — Execute full test suite
4. Create Artifacts — Package for deployment

### Example Session

```
User: build
Operations Agent: Starting build process...

## Prerequisites Check
✓ All construction bolts complete
✓ No uncommitted changes
✓ On main branch

## Build
Running: npm run build
✓ TypeScript compilation successful
✓ Bundle created (245KB gzipped)

## Tests
Running: npm test
✓ 47 unit tests passed
✓ 12 integration tests passed
✓ 5 e2e tests passed

## Artifacts
✓ Docker image built: myapp:1.2.0
✓ Image pushed to registry

Build complete. Ready for deployment.
```

## deploy

Deploys to a target environment:

```
> deploy staging
```

Or for production:

```
> deploy production
```

The agent will:
1. Environment Check — Verify target environment configuration
2. Pre-deployment — Run database migrations, cache warming
3. Deploy — Deploy using configured strategy
4. Health Check — Verify services are healthy

### Deployment Strategies

| Strategy | Description |
|----------|-------------|
| **Rolling** | Replace instances gradually |
| **Blue-Green** | Switch between two environments |
| **Canary** | Route percentage of traffic to new version |

> Production deployments require explicit confirmation. The agent will show exactly what will happen before proceeding.

## verify

Runs verification after deployment:

```
> verify staging
```

The agent will:
1. Smoke Tests — Run quick sanity checks
2. Health Endpoints — Check all service health endpoints
3. Integration Check — Verify integrations are working
4. Performance Baseline — Ensure response times are acceptable

### Example Output

```
User: verify staging
Operations Agent: Running verification for staging...

## Smoke Tests
✓ Homepage loads (234ms)
✓ API responds (45ms)
✓ Authentication works

## Health Endpoints
✓ /health - OK (12ms)
✓ /health/db - OK (23ms)
✓ /health/cache - OK (8ms)

## Integration Check
✓ Database connection
✓ Redis connection
✓ Email service

## Performance
✓ p50 latency: 45ms (target: <100ms)
✓ p95 latency: 123ms (target: <500ms)
✓ p99 latency: 234ms (target: <1000ms)

Verification passed. Staging is healthy.
```

## monitor

Sets up or checks monitoring:

```
> monitor setup
```

Or check current status:

```
> monitor status
```

The agent helps with:
- **Logging** — Structured logging configuration
- **Metrics** — Key performance indicators
- **Alerts** — Alert rules and thresholds
- **Dashboards** — Visualization of system health

### Key Metrics

The agent suggests monitoring:

| Category | Metrics |
|----------|---------|
| **Availability** | Uptime, error rate, success rate |
| **Performance** | Latency (p50, p95, p99), throughput |
| **Resources** | CPU, memory, disk, connections |
| **Business** | Active users, transactions, conversions |

## Human Checkpoints

The Operations Agent has **4 human checkpoints** aligned with environment progression:

1. **After build** — Approve build artifacts before deployment
2. **Before staging deploy** — Confirm ready for staging environment
3. **Before production deploy** — Critical approval for production
4. **After monitoring setup** — Confirm operations complete

```
Prerequisites → Build Artifacts → ✋ Gate 1 → Deploy to Dev → Deploy to Staging → ✋ Gate 2 → Verify Staging → ✋ Gate 3 → Deploy to Production → ✋ Gate 4 → Verify Production → Setup Monitoring → ✋ Gate 4 → Complete
```

> Production deployment (Gate 3) requires explicit confirmation. The agent will show exactly what will happen before proceeding.

## Artifacts

Operations artifacts are stored in:

```
memory-bank/operations/
├── environments.md      # Environment configurations
├── runbooks/           # Operational procedures
│   ├── deployment.md
│   ├── rollback.md
│   └── incident.md
└── monitoring/
    ├── alerts.md
    └── dashboards.md
```

## Runbooks

The agent generates runbooks for common operations:

### Deployment Runbook
Step-by-step deployment procedure:
1. Pre-deployment checklist
2. Deployment commands
3. Verification steps
4. Rollback procedure

### Incident Response
What to do when things go wrong:
1. Detection and triage
2. Escalation matrix
3. Communication template
4. Post-mortem process

### Scaling Runbook
How to handle increased load:
1. Signs of scaling needs
2. Horizontal vs vertical
3. Scaling commands
4. Verification

## Best Practices

- **Always Verify** — Never skip verification after deployment. Automated checks catch issues humans miss.
- **Stage Environments** — Deploy to staging before production. Test the deployment process itself.
- **Monitor Proactively** — Set up alerts before you need them. Don't wait for production issues.
- **Document Runbooks** — Keep runbooks updated. They're essential during incidents.

## Troubleshooting

- **Agent doesn't remember context** — Agents are stateless—they read artifacts from Memory Bank at startup. Ensure artifacts are saved after each step.
- **Command failed** — Check the error message, fix the issue, and retry the command.
- **Multiple environments exist** — Use `deploy <environment>` to specify target environment.
