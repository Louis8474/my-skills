---
name: devops
description: Designs and implements CI/CD pipelines, Docker containerization, multi-environment deployment, and release strategies. Use when setting up automated builds, deploying an application for the first time, adding tests to a pipeline, or managing release processes. Always confirm the existing hosting provider and repository before applying templates.
---

# DevOps Engineering

## Purpose
DevOps solves the "works on my machine" problem by codifying the build, test, and deploy process into a repeatable, automated pipeline. For vibe-coders, this is often the last step they think about and the first step that breaks in production. This skill builds the deployment pipeline alongside the application, not after.

## SOP: CI/CD and Containerization

### Step 1 - Stack Discovery
Before applying any templates, ask:
> "What's your hosting provider? (e.g., Vercel, Railway, AWS ECS, GCP Cloud Run, Fly.io) And where is your repository? (GitHub, GitLab, Bitbucket)"

The CI/CD platform and Dockerfile structure depend on these choices. Most Next.js frontends go to Vercel (no Dockerfile needed). FastAPI backends go to Railway, Fly.io, or a container registry.

### Step 2 - Dockerfile (FastAPI Backend)
Use a multi-stage build to keep the production image small:

```dockerfile
# Dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
RUN pip install uv
COPY pyproject.toml .
RUN uv pip install --system -e "."

FROM python:3.12-slim AS runtime
WORKDIR /app
RUN adduser --disabled-password --gecos "" appuser  # non-root user
COPY --from=builder /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY --from=builder /usr/local/bin /usr/local/bin
COPY src/ ./src/

USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:8000/health || exit 1
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Key rules:**
- Always use a non-root user in production images.
- Always include a `HEALTHCHECK`.
- Never copy `.env` files into the image. Inject environment variables at runtime.

### Step 3 - Docker Compose (Local Development)
```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports: ["8000:8000"]
    env_file: .env
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./src:/app/src  # hot reload in dev

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  postgres_data:
```

### Step 4 - GitHub Actions CI Pipeline
```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: testdb
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
        ports: ["5432:5432"]

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: "3.12" }
      - run: pip install uv && uv pip install --system -e ".[dev]"
      - run: ruff check src/            # lint
      - run: mypy src/                  # type check
      - run: pytest --cov=src tests/    # tests with coverage
        env:
          DATABASE_URL: postgresql+asyncpg://test:test@localhost:5432/testdb

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/${{ github.repository }}:${{ github.sha }}
```

### Step 5 - Environment Configuration
Define three environments with separate configs:

| Environment | Config File | Secrets Source | DB |
|---|---|---|---|
| `development` | `.env` (git-ignored) | Local file | Local Docker PostgreSQL |
| `staging` | Platform environment vars | Platform secret store | Managed DB (same schema as prod) |
| `production` | Platform environment vars | Platform secret store | Managed DB |

Staging must mirror production in schema and config. Never test migrations directly on production.

### Step 6 - Release SOP
1. All work happens on feature branches.
2. PR to `develop` triggers the CI test suite.
3. Merge to `develop` auto-deploys to staging.
4. After staging sign-off, PR `develop` -> `main`.
5. Merge to `main` builds and pushes the Docker image, tagged with git SHA.
6. Deploy to production by updating the image tag in the deployment config.
7. Tag the release: `git tag -a v1.2.0 -m "Release v1.2.0"` using semantic versioning.

Use conventional commits for changelog generation: `feat:`, `fix:`, `chore:`, `docs:`.
