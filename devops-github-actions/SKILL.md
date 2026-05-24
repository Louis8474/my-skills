---
name: devops-github-actions
description: Expert assistant for GitHub Actions workflows, CI/CD pipelines, deployments, and automation. Trigger on "github actions", "workflow", "ci/cd", "pipeline", "deploy", "runner", "action".
license: MIT
compatibility: all
---

# GitHub Actions Skill

Expert guidance on creating, reviewing, and troubleshooting GitHub Actions workflows.

## When to Use

Trigger this skill when the user mentions:
- "github actions", "workflow", "GHA"
- "ci/cd", "pipeline", "continuous integration", "continuous deployment"
- "runner", "self-hosted runner", "github-hosted"
- "deploy", "deployment environment"
- "action", "composite action", "reusable workflow"

## Core Workflow

### 1. Understand Requirements
Ask clarifying questions:
- What triggers the workflow? (push, PR, schedule, manual)
- What language/framework? (Node, Python, Go, Java, .NET, etc.)
- What runner type? (ubuntu-latest, windows-latest, self-hosted)
- Deployment target? (AWS, Azure, GCP, Docker, K8s, etc.)
- Security needs? (OIDC, secrets, environments)

### 2. Reference Documentation
Load relevant reference files from `reference/` based on the task:

| Topic | Reference Path |
|-------|----------------|
| Syntax | `reference/reference/workflow-syntax.md` |
| Events | `reference/reference/events-that-trigger-workflows.md` |
| Contexts | `reference/reference/contexts.md` |
| Expressions | `reference/reference/workflows-and-actions.md` |
| Security | `reference/reference/security.md` |
| Runners | `reference/reference/runners.md` |
| Environments | `reference/reference/workflows-and-actions.md` |
| How-tos | `reference/how-tos/` (troubleshooting, deploy, etc.) |
| Tutorials | `reference/tutorials/` (language-specific guides) |
| Concepts | `reference/concepts/` (runners, security, workflows) |

### 3. Generate Workflow

Follow this structure for workflow files:

```yaml
name: <descriptive-name>

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      # Add steps here
```

## Best Practices

### Security
- Always set explicit `permissions` (principle of least privilege)
- Pin actions to SHA, not tags: `uses: actions/checkout@<sha>`
- Use OIDC for cloud deployments instead of long-lived credentials
- Store sensitive data in GitHub Secrets, never hardcode
- Use `GITHUB_TOKEN` with minimal scopes

### Performance
- Use dependency caching (`actions/cache` or built-in cache in setup-* actions)
- Use matrix strategies for parallel builds
- Use `concurrency` to cancel redundant runs
- Consider `skip-duplicate-actions` for path filtering

### Structure
- Use reusable workflows for shared CI patterns
- Use composite actions for repeated step sequences
- Separate build, test, and deploy into distinct jobs
- Use `needs` for job dependencies, `if` for conditional execution

## Common Patterns

### Node.js CI
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
- run: npm ci
- run: npm test
```

### Python CI
```yaml
- uses: actions/setup-python@v5
  with:
    python-version: '3.12'
    cache: 'pip'
- run: pip install -r requirements.txt
- run: pytest
```

### Docker Build & Push
```yaml
- uses: docker/setup-buildx-action@v3
- uses: docker/build-push-action@v5
  with:
    push: true
    tags: user/app:latest
```

### Deploy with OIDC (AWS)
```yaml
permissions:
  id-token: write
  contents: read
steps:
  - uses: aws-actions/configure-aws-credentials@v4
    with:
      role-to-assume: arn:aws:iam::123456789:role/deploy
      aws-region: us-east-1
```

### Scheduled Nightly Build
```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # 2am UTC daily
  workflow_dispatch:      # also allow manual trigger

jobs:
  nightly:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: npm ci && npm test
```

### Monorepo Path Filtering
```yaml
on:
  push:
    paths:
      - 'packages/frontend/**'
      - '!packages/frontend/**/*.md'  # ignore doc-only changes

jobs:
  frontend:
    if: contains(github.event.head_commit.modified, 'packages/frontend/')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - run: npm ci && npm test
    # Alternative: use dorny/paths-filter for multi-output filtering
```

### Workflow Dispatch with Inputs
```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        type: choice
        options: [staging, production]
        default: staging
      dry_run:
        description: 'Simulate without deploying'
        type: boolean
        default: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - run: echo "Deploying to ${{ inputs.environment }}"
      - if: inputs.dry_run == false
        run: echo "Real deployment here"
```

### PR Size Labeler
```yaml
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  label:
    runs-on: ubuntu-latest
    steps:
      - uses: codelytv/pr-size-labeler@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          xs_max_size: 10
          s_max_size: 100
          m_max_size: 500
          l_max_size: 1000
          fail_if_xl: false
```

### Release with release-please
```yaml
on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          release-type: node  # or python, java, go, ruby, etc.
```

## Troubleshooting

Common issues and solutions:
- **Workflow not triggering**: Check branch filters, event configuration
- **Permission denied**: Review `permissions` block and repository settings
- **Cache not working**: Verify cache key uniqueness and path
- **OIDC failures**: Check trust policy, audience, subject claims

For detailed troubleshooting, reference `reference/how-tos/troubleshoot-workflows.md`.

## Output Guidelines

When generating workflows:
1. Include explanatory comments for non-obvious steps
2. Add a brief explanation of the workflow structure
3. Suggest security improvements if applicable
4. Point to relevant documentation for advanced options

## File Location

Workflows must be placed in `.github/workflows/` directory with `.yml` or `.yaml` extension.
