---
name: backend
description: Implements server-side application logic, data access layers, and background services using Python 3.12 and FastAPI. Use for building service classes, repositories, background tasks, middleware, or any Python code that runs on the server. Always ask about the existing stack before applying defaults.
---

# Backend Engineering

## Default Stack (Ask First)
Before applying anything, ask:
> "Can I use the Supernova backend stack? Python 3.12 + FastAPI + SQLAlchemy 2.0 async + PostgreSQL. Or do you have an existing backend stack I should match?"

If an existing `requirements.txt`, `pyproject.toml`, or `setup.py` is detected, read it and match the existing stack.

## Progressive Disclosure
- Load `references/fastapi-patterns.md` when setting up dependency injection, middleware, or lifespan events.
- Load `references/sqlalchemy-async.md` when implementing async DB sessions or complex ORM queries.

## SOP: Backend Implementation

### Step 1 - Project Scaffold (New Projects Only)
For greenfield projects, structure the project as follows. Do not deviate:

```
src/
├── main.py              # FastAPI app instance, lifespan, router inclusion
├── config.py            # pydantic-settings BaseSettings
├── database.py          # Async engine + session factory
├── models/              # SQLAlchemy ORM models (one file per domain entity)
├── schemas/             # Pydantic request/response models
├── repositories/        # Data access layer (all DB queries live here)
├── services/            # Business logic (calls repositories, never raw DB)
├── api/
│   └── v1/              # FastAPI routers (thin - delegate to services)
├── middleware/          # Custom ASGI middleware
└── tests/               # pytest-asyncio test files mirroring src/ structure
```

`pyproject.toml` is the only dependency file. Use `uv` as the package manager.

### Step 2 - Dependency Management
```toml
# pyproject.toml
[project]
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.111.0",
    "uvicorn[standard]>=0.29.0",
    "sqlalchemy[asyncio]>=2.0.0",
    "asyncpg>=0.29.0",
    "pydantic>=2.7.0",
    "pydantic-settings>=2.2.0",
    "alembic>=1.13.0",
    "structlog>=24.1.0",
]

[project.optional-dependencies]
dev = ["pytest>=8.0", "pytest-asyncio>=0.23", "httpx>=0.27", "ruff>=0.4"]
```

Install with: `uv pip install -e ".[dev]"`

### Step 3 - Application Layering (Strict Separation)
The request lifecycle must flow exactly as follows. Do not skip layers:

```
HTTP Request
  -> FastAPI Router (validates request schema via Pydantic)
  -> Service Layer (applies business logic, raises domain exceptions)
  -> Repository Layer (executes SQLAlchemy queries)
  -> Database
```

**Router rules:** Routers only receive validated Pydantic inputs and return Pydantic outputs. No SQL, no business logic.

**Service rules:** Services call repositories and other services. They raise `HTTPException` or custom domain exceptions. Never return raw ORM models - always map to schemas.

**Repository rules:** Repositories are the only place that imports `AsyncSession`. Every method is `async def`. Return ORM model instances, not dicts.

### Step 4 - Pydantic v2 Model Patterns
```python
from pydantic import BaseModel, EmailStr, ConfigDict
from uuid import UUID
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    display_name: str

class UserCreate(UserBase):
    password: str  # plain text in; hashed in service

class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    created_at: datetime
```

Always define three Pydantic models per entity: `Base` (shared fields), `Create` (input), `Out` (response). Never expose ORM models directly.

### Step 5 - Async SQLAlchemy Session Pattern
```python
# database.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
```

Inject with `db: AsyncSession = Depends(get_db)` in services via the router. Never create sessions manually outside of this factory.

### Step 6 - Structured Logging
```python
import structlog

log = structlog.get_logger()

async def create_user(user_in: UserCreate, db: AsyncSession) -> UserOut:
    log.info("creating_user", email=user_in.email)
    # ...
    log.info("user_created", user_id=str(user.id))
    return UserOut.model_validate(user)
```

Log with structured key=value pairs, never f-strings in log calls. Include `user_id`, `request_id`, and relevant entity IDs in every log line.

### Step 7 - Error Handling
```python
# In service layer
from fastapi import HTTPException

async def get_user_by_id(user_id: UUID, db: AsyncSession) -> UserOut:
    user = await user_repo.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")
    return UserOut.model_validate(user)
```

Define a global exception handler in `main.py` for unhandled exceptions: log the full traceback with structlog, return a generic `500` response. Never expose stack traces to API consumers.

### Step 8 - Environment Configuration
```python
# config.py
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    DATABASE_URL: str
    SECRET_KEY: str
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

settings = Settings()
```

`.env` is git-ignored. Provide `.env.example` with all keys and no values.

### Step 9 - Testing Pattern
```python
# tests/test_user_service.py
import pytest
from httpx import AsyncClient, ASGITransport
from src.main import app

@pytest.mark.asyncio
async def test_create_user():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/users", json={"email": "test@test.com", ...})
    assert response.status_code == 201
    assert "id" in response.json()["data"]
```

Test via the HTTP layer, not by calling services directly. This ensures routers, validation, and middleware are also tested.
