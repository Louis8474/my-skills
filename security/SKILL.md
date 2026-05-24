---
name: security
description: Applies OWASP Top 10 mitigations, secure authentication, authorization, secret management, and data protection practices to FastAPI backends and Next.js frontends. Use for any feature involving auth, user data, payments, file uploads, or system access. Always invoke security review before shipping any user-facing API endpoint.
---

# Security Engineering

## Purpose
Security failures in AI-assisted development happen not because the AI produces insecure code on purpose, but because vibe-coders do not ask for security in their prompts. This skill changes that: it exists to run an explicit security pass over every user-facing feature.

## SOP: Security Hardening

### Step 1 - Threat Model (Minimal)
For each feature, answer:
1. What data does this endpoint read or write?
2. Who should be allowed to call this endpoint? (Any user, authenticated user only, admin only, internal service only?)
3. What is the impact if this endpoint is abused? (Data breach? Account takeover? Financial loss?)

High-impact answers mean higher scrutiny in subsequent steps.

### Step 2 - OWASP Top 10 Checklist (FastAPI + Next.js)

| OWASP Category | FastAPI Mitigation | Next.js Mitigation |
|---|---|---|
| A01 - Broken Access Control | `Depends(get_current_user)` on every protected route; row-level checks in service layer | `getServerSession()` on protected server actions; middleware on protected routes |
| A02 - Cryptographic Failures | `passlib[bcrypt]` for passwords; TLS in production (no HTTP) | `httpOnly` + `Secure` + `SameSite=Lax` on JWT cookies |
| A03 - Injection | SQLAlchemy ORM parameters only (never f-string SQL); Pydantic input validation | Zod schema validation on all form inputs |
| A04 - Insecure Design | ADR-reviewed threat model before feature build | User journey maps reviewed for privilege escalation paths |
| A05 - Security Misconfiguration | CORS restricted to known origins; debug=False in prod | `X-Frame-Options`, `Content-Security-Policy` headers via `next.config.js` |
| A06 - Vulnerable Components | `pip-audit` in CI pipeline; `npm audit` in CI pipeline | Same |
| A07 - Auth Failures | JWT access token (15min TTL) + refresh token (7d, httpOnly cookie, rotated on use) | Redirect unauthenticated users server-side via middleware |
| A09 - Logging Failures | structlog all auth events: login, logout, failed attempt, token refresh | Never log sensitive fields (password, full card number, SSN) |
| A10 - SSRF | Validate and allowlist URLs for any user-supplied URL fetches | Block metadata endpoint IPs (169.254.x.x) |

### Step 3 - Authentication Implementation

**JWT Pattern (FastAPI):**
```python
# auth/jwt.py
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt

ACCESS_TOKEN_TTL = timedelta(minutes=15)
REFRESH_TOKEN_TTL = timedelta(days=7)
ALGORITHM = "HS256"

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + ACCESS_TOKEN_TTL
    return jwt.encode({"sub": user_id, "exp": expire}, settings.SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
```

**Refresh token rotation:** Store refresh tokens in the DB (hashed). Invalidate on use and issue a new one. Detect token reuse (sign of theft) and revoke the entire family.

**Password hashing:**
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

Never store plain passwords. Never use MD5 or SHA1 for passwords.

### Step 4 - Authorization (Row-Level)
Authentication answers "who are you?" Authorization answers "what are you allowed to do?".

```python
# In service layer - not in the router
async def get_order(order_id: UUID, current_user: User, db: AsyncSession) -> OrderOut:
    order = await order_repo.get_by_id(db, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    if order.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(403, "Access denied")  # Do not reveal existence of the resource
    return OrderOut.model_validate(order)
```

Return 404, not 403, when a non-owner accesses a resource. Returning 403 reveals that the resource exists.

### Step 5 - CORS and Security Headers

**FastAPI:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # e.g., ["https://yourapp.com"]
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)
```

**Next.js (`next.config.js`):**
```js
const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline'" },
];
module.exports = { headers: async () => [{ source: "/(.*)", headers: securityHeaders }] };
```

### Step 6 - Secret Management
- All secrets live in `.env`, never in code.
- `.env` is in `.gitignore`; provide `.env.example` with key names but no values.
- In production, use the platform's secret manager (AWS Secrets Manager, GCP Secret Manager, Vercel Environment Variables).
- Rotate `SECRET_KEY` on a defined schedule (every 90 days minimum).
- Run `git secrets --scan` or `trufflehog` in CI to catch accidental secret commits.
