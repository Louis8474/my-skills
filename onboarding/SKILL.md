---
name: onboarding
description: Sets up a new project from scratch — creates the complete repository structure, configuration files, environment setup, and base scaffolding so development can start immediately. Use this as the FIRST skill on any brand-new project before any other skill runs. Trigger when the user says "start a new project", "scaffold a new app", "I want to build X from scratch", "initialize project", or when no code exists yet and the user is describing an idea.
---

# Project Onboarding (Day-0 Setup)

## Purpose
The most common vibe-coder mistake on a new project is starting to code before the project structure exists. This leads to files scattered everywhere, no `.gitignore`, hardcoded secrets in source code, and a project that cannot be replicated by another developer. This skill creates a production-ready foundation in one pass.

## Pre-Flight: Stack Confirmation
Before generating any files, ask:

> "I'll set up a new project with the Supernova standard stack:
> - **Backend**: Python 3.12 + FastAPI + SQLAlchemy + PostgreSQL
> - **Frontend**: Next.js 14 + TypeScript + Tailwind + Shadcn/ui
> - **Infrastructure**: Docker Compose (local), GitHub Actions (CI)
>
> Does this work for your project, or do you have a preference?"

If the user has an existing project, STOP and use the appropriate domain skill instead.

## SOP: Project Scaffold

### Step 1 - Repository Root
```bash
# Repository structure
my-project/
├── .github/
│   └── workflows/
│       └── ci.yml          # GitHub Actions CI pipeline
├── backend/                # FastAPI app
│   ├── src/
│   │   ├── api/v1/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── schemas/
│   │   ├── auth/
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── alembic/
│   │   └── versions/
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── .env.example
├── frontend/               # Next.js app
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── package.json
├── docker-compose.yml      # Full local dev stack
├── .gitignore
└── README.md
```

### Step 2 - Backend: `pyproject.toml`
```toml
[project]
name = "my-project-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.111",
    "uvicorn[standard]>=0.29",
    "sqlalchemy>=2.0",
    "asyncpg>=0.29",
    "alembic>=1.13",
    "pydantic>=2.7",
    "pydantic-settings>=2.2",
    "structlog>=24",
    "passlib[bcrypt]>=1.7",
    "python-jose[cryptography]>=3.3",
    "python-multipart>=0.0.9",
    "httpx>=0.27",
]

[project.optional-dependencies]
dev = [
    "pytest>=8",
    "pytest-asyncio>=0.23",
    "pytest-cov>=5",
    "httpx>=0.27",
    "ruff>=0.4",
    "mypy>=1.10",
]

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
testpaths = ["tests"]
addopts = "--cov=src --cov-report=term-missing --cov-fail-under=80"
```

### Step 3 - `.env.example` (Committed to Repo)
```bash
# Application
APP_NAME=My Project
DEBUG=true
SECRET_KEY=change-this-to-a-random-64-char-string

# Database
DATABASE_URL=postgresql+asyncpg://postgres:password@localhost:5432/myproject

# Redis
REDIS_URL=redis://localhost:6379/0

# Frontend
FRONTEND_URL=http://localhost:3000

# Email (Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=no-reply@yourdomain.com

# Storage (optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=
CDN_BASE_URL=
```

The `.env` file (with real values) is in `.gitignore`. Only `.env.example` is committed.

### Step 4 - `docker-compose.yml`
```yaml
services:
  api:
    build: ./backend
    ports: ["8000:8000"]
    env_file: ./backend/.env
    depends_on:
      db: { condition: service_healthy }
      redis: { condition: service_started }
    volumes: ["./backend:/app"]
    command: uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: myproject
    volumes: [postgres_data:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  postgres_data:
```

### Step 5 - Backend `main.py`
```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings
from src.api.v1 import router as v1_router
import structlog

log = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("startup", env=settings.ENV)
    yield
    log.info("shutdown")

app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(v1_router, prefix="/api/v1")

@app.get("/health")
async def health():
    return {"status": "ok"}
```

### Step 6 - Frontend Initialization
```bash
npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd frontend
npx shadcn@latest init
```

### Step 7 - `.gitignore`
```
# Python
__pycache__/
*.pyc
.venv/
dist/
*.egg-info/

# Environment
.env
*.env.local

# Next.js
frontend/.next/
frontend/node_modules/
frontend/out/

# Coverage
.coverage
htmlcov/

# OS
.DS_Store
Thumbs.db
```

### Step 8 - Initial README
Generate a README with:
- Project name and 1-sentence description
- Prerequisites (Python 3.12, Node 20, Docker)
- Quick Start (5 steps: clone, copy `.env.example`, docker-compose up, alembic upgrade head, npm run dev)
- Tech stack table
- Contributing guide stub

### Step 9 - First Git Commit
```bash
git init
git add .
git commit -m "chore: initial project scaffold"
git branch -M main
git remote add origin <url>
git push -u origin main
```

After this, hand off to the appropriate domain skill (`backend`, `frontend`, `db`, etc.) to implement the first feature.
