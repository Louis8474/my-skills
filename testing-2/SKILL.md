---
name: testing
description: Designs and implements unit tests, integration tests, and end-to-end (E2E) tests for FastAPI backends and Next.js frontends. Enforces TDD where appropriate, defines test structure, mocking strategies, and coverage targets. Use when writing tests for new features, setting up test infrastructure from scratch, debugging failing tests, or validating test coverage before a release. Trigger when user mentions "tests", "pytest", "Vitest", "Playwright", "coverage", or "TDD".
---

# Testing Engineering

## Purpose
Tests are the only mechanism that proves the code does what the plan says it should. For vibe-coders, this is the most skipped step - and the one that causes the most production incidents. This skill does not treat tests as optional polish; it treats them as a deliverable equal in importance to the feature itself.

## Progressive Disclosure
- Load `references/pytest-patterns.md` for advanced fixtures, parametrize, and async test patterns.
- Load `references/playwright-e2e.md` for page object model and multi-browser E2E patterns.

## SOP: Testing Strategy

### Step 1 - Define the Testing Pyramid for This Feature
Before writing any test, identify what layer of the pyramid applies:

```
         [E2E Tests]           <- Few, slow, highest confidence (Playwright)
       [Integration Tests]     <- Some, moderate speed (pytest with real DB)
     [Unit Tests]              <- Many, fast, isolated (pytest with mocks)
```

For each feature ask:
- Is there critical user-facing behavior that could break silently? -> E2E test.
- Does this feature involve multiple system components working together (API + DB)? -> Integration test.
- Does this function have complex internal logic with branching conditions? -> Unit test.

Not every feature needs all three. A utility function only needs unit tests. A checkout flow needs all three.

### Step 2 - Backend Testing (pytest + pytest-asyncio)

**Project setup:**
```bash
uv pip install ".[dev]"  # pytest, pytest-asyncio, httpx, pytest-cov already in dev deps
```

**`pytest.ini` / `pyproject.toml` config:**
```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"          # all async test functions automatically run with asyncio
testpaths = ["tests"]
addopts = "--cov=src --cov-report=term-missing --cov-fail-under=80"
```

**Unit Test - Pure function (no DB, no HTTP):**
```python
# tests/unit/test_auth_service.py
from src.services.auth_service import hash_password, verify_password

def test_password_is_hashed():
    hashed = hash_password("mysecret")
    assert hashed != "mysecret"
    assert len(hashed) > 30  # bcrypt hash is always 60 chars

def test_correct_password_verifies():
    hashed = hash_password("mysecret")
    assert verify_password("mysecret", hashed) is True

def test_wrong_password_fails():
    hashed = hash_password("mysecret")
    assert verify_password("wrongpassword", hashed) is False
```

**Integration Test - HTTP layer with real DB:**
```python
# tests/integration/test_user_api.py
import pytest
from httpx import AsyncClient, ASGITransport
from src.main import app
from src.database import AsyncSessionLocal
from src.models.user import User

@pytest.fixture(autouse=True)
async def clean_db():
    """Truncate test tables before each test."""
    async with AsyncSessionLocal() as db:
        await db.execute(text("TRUNCATE users CASCADE"))
        await db.commit()
    yield

@pytest.mark.asyncio
async def test_create_user_returns_201():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.post("/api/v1/users", json={
            "email": "test@example.com",
            "display_name": "Test User",
            "password": "StrongP@ss1"
        })
    assert response.status_code == 201
    body = response.json()
    assert "data" in body
    assert body["data"]["email"] == "test@example.com"
    assert "password" not in body["data"]  # never expose hashed password

@pytest.mark.asyncio
async def test_duplicate_email_returns_409():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        payload = {"email": "dup@example.com", "display_name": "User", "password": "StrongP@ss1"}
        await client.post("/api/v1/users", json=payload)
        response = await client.post("/api/v1/users", json=payload)
    assert response.status_code == 409
```

**Mocking external services:**
```python
# tests/unit/test_email_service.py
from unittest.mock import AsyncMock, patch

@pytest.mark.asyncio
async def test_welcome_email_is_sent_on_user_creation():
    with patch("src.services.email_service.send_email", new_callable=AsyncMock) as mock_send:
        await user_service.create(UserCreate(email="a@b.com", ...))
        mock_send.assert_called_once_with(
            to="a@b.com",
            subject="Welcome to Supernova",
            template="welcome"
        )
```

### Step 3 - Frontend Testing (Vitest + React Testing Library)

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/user-event @vitejs/plugin-react jsdom
```

**Unit Test - React component:**
```typescript
// src/components/__tests__/UserCard.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { UserCard } from "@/components/UserCard";
import { describe, it, expect, vi } from "vitest";

describe("UserCard", () => {
  it("renders display name", () => {
    render(<UserCard userId="1" displayName="Alice" avatarUrl={null} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("calls onRemove with userId when remove button clicked", async () => {
    const onRemove = vi.fn();
    render(<UserCard userId="42" displayName="Bob" avatarUrl={null} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole("button", { name: /remove bob/i }));
    expect(onRemove).toHaveBeenCalledWith("42");
  });
});
```

**API hook test with MSW (Mock Service Worker):**
```typescript
// src/hooks/__tests__/useUsers.test.tsx
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { renderHook, waitFor } from "@testing-library/react";
import { useUsers } from "@/hooks/useUsers";

const server = setupServer(
  http.get("/api/v1/users", () => HttpResponse.json({ data: [{ id: "1", email: "a@b.com" }] }))
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

it("fetches and returns users", async () => {
  const { result } = renderHook(() => useUsers());
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data).toHaveLength(1);
});
```

### Step 4 - E2E Testing (Playwright)

**Install:**
```bash
npx playwright install --with-deps
```

**`playwright.config.ts`:**
```typescript
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: !process.env.CI },
});
```

**E2E test - Critical user flow:**
```typescript
// e2e/auth.spec.ts
import { test, expect } from "@playwright/test";

test("user can sign up and see dashboard", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Email").fill("new@user.com");
  await page.getByLabel("Password").fill("StrongP@ss1");
  await page.getByRole("button", { name: "Sign Up" }).click();
  await expect(page).toHaveURL("/dashboard");
  await expect(page.getByRole("heading", { name: "Welcome" })).toBeVisible();
});
```

### Step 5 - Coverage Gate
Coverage is a floor, not a ceiling. Set targets per layer:

| Layer | Minimum Coverage | Tool |
|---|---|---|
| Backend unit + integration | 80% | `pytest --cov-fail-under=80` |
| Frontend components | 70% | `vitest --coverage` |
| E2E critical paths | 100% of P0 user flows | Manual list review |

Failing coverage fails the CI build. Do not merge below the threshold.

### Step 6 - Test Naming Convention
Name tests so the failure message is self-documenting:
- `test_<what>_<when>_<expected>` for Python: `test_create_user_with_duplicate_email_returns_409`
- `it("<action> <expected outcome>")` for TypeScript: `it("calls onRemove with userId when button clicked")`

A test named `test_user()` is useless in a CI failure log.
