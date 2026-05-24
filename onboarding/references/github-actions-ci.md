# Onboarding Reference: GitHub Actions CI Pipeline

## Standard CI Pipeline for Supernova Projects
Save as `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend:
    name: Backend Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: password
          POSTGRES_DB: testdb
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports: ["6379:6379"]

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.12"

      - name: Install uv
        run: pip install uv

      - name: Install dependencies
        run: uv pip install -e ".[dev]" --system
        working-directory: backend

      - name: Lint (ruff)
        run: ruff check src/
        working-directory: backend

      - name: Type check (mypy)
        run: mypy src/ --ignore-missing-imports
        working-directory: backend

      - name: Run tests
        env:
          DATABASE_URL: postgresql+asyncpg://postgres:password@localhost:5432/testdb
          REDIS_URL: redis://localhost:6379/0
          SECRET_KEY: ci-secret-key-not-for-production
          ENV: test
        run: pytest --cov=src --cov-report=xml --cov-fail-under=80
        working-directory: backend

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          file: backend/coverage.xml
          fail_ci_if_error: false

  frontend:
    name: Frontend Tests
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: frontend

      - name: TypeScript type check
        run: npx tsc --noEmit
        working-directory: frontend

      - name: Lint
        run: npm run lint
        working-directory: frontend

      - name: Unit tests
        run: npm run test -- --run --coverage
        working-directory: frontend
```

## Branch Protection Rules (Set in GitHub Settings)
For `main` branch:
- ✅ Require status checks to pass before merging
  - Required checks: `Backend Tests`, `Frontend Tests`
- ✅ Require pull request reviews (at least 1 approval)
- ✅ Require up-to-date branches before merging
- ✅ Do not allow bypassing the above settings

## Environment Secrets in GitHub Actions
In GitHub Settings > Secrets and Variables > Actions, add:
```
SENTRY_DSN=https://...@sentry.io/...
CODECOV_TOKEN=...
```

These are available in CI as `${{ secrets.SENTRY_DSN }}`.

**Never put real API keys or DB URLs in the workflow YAML.** The test database is a fresh isolated container — use dummy credentials.
