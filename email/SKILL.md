---
name: email
description: Implements transactional email via Resend or SendGrid — welcome emails, password resets, order confirmations, and notification digests. Covers HTML template rendering, queue-based sending via Celery, unsubscribe handling, and bounce management. Use when adding any email to an application. Trigger when user mentions "send email", "email notification", "welcome email", "password reset email", "Resend", "SendGrid", "SMTP", "transactional email", or "email template".
---

# Email Engineering

## Purpose
Email is deceptively fragile in production. Synchronous email in a request handler blocks the user and causes 500s when the mail server is slow. Hardcoded HTML strings break with special characters. Missing unsubscribe links violate CAN-SPAM. This skill enforces queue-based sending with proper HTML templates and handles the edge cases that break email deliverability.

## Provider Decision
| Need | Provider |
|---|---|
| Simple setup, excellent DX, modern API | **Resend** (recommended for new projects) |
| High volume, advanced analytics | SendGrid |
| Self-hosted / cost sensitive | SMTP with Postfix or Amazon SES |

## SOP: Email Integration (Resend)

### Step 1 - Setup
```bash
uv pip install resend jinja2
```

```python
# config.py
class Settings(BaseSettings):
    RESEND_API_KEY: str           # re_...
    EMAIL_FROM: str               # "Supernova <no-reply@yourdomain.com>"
    FRONTEND_URL: str             # for links in emails
```

### Step 2 - Email Templates with Jinja2
Never build HTML emails with f-strings. Use template files.

Create `src/templates/email/` directory:

**`src/templates/email/base.html`:**
```html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; padding: 32px 16px;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; padding: 32px;">
    <img src="{{ frontend_url }}/logo.png" alt="{{ app_name }}" height="32" style="margin-bottom: 24px;">
    {% block content %}{% endblock %}
    <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;">
    <p style="color: #9ca3af; font-size: 12px;">
      © {{ year }} {{ app_name }}.
      {% if unsubscribe_url %}
      <a href="{{ unsubscribe_url }}" style="color: #9ca3af;">Unsubscribe</a>
      {% endif %}
    </p>
  </div>
</body>
</html>
```

**`src/templates/email/welcome.html`:**
```html
{% extends "email/base.html" %}
{% block content %}
<h1 style="font-size: 24px; color: #111827; margin-bottom: 8px;">Welcome, {{ display_name }}!</h1>
<p style="color: #374151; line-height: 1.6;">Your account is ready. Get started by completing your profile.</p>
<a href="{{ cta_url }}" style="display: inline-block; background: #6366f1; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px;">Go to Dashboard</a>
{% endblock %}
```

### Step 3 - Email Service
```python
# services/email_service.py
import resend
from jinja2 import Environment, FileSystemLoader, select_autoescape
from datetime import datetime
from src.config import settings

resend.api_key = settings.RESEND_API_KEY

_jinja = Environment(
    loader=FileSystemLoader("src/templates"),
    autoescape=select_autoescape(["html"]),
)

def _render(template_name: str, **context) -> str:
    context.setdefault("frontend_url", settings.FRONTEND_URL)
    context.setdefault("app_name", "Supernova")
    context.setdefault("year", datetime.now().year)
    context.setdefault("unsubscribe_url", None)
    return _jinja.get_template(f"email/{template_name}.html").render(**context)

async def send_welcome_email(user_email: str, display_name: str) -> None:
    resend.Emails.send({
        "from": settings.EMAIL_FROM,
        "to": user_email,
        "subject": "Welcome to Supernova 🚀",
        "html": _render("welcome", display_name=display_name, cta_url=f"{settings.FRONTEND_URL}/dashboard"),
    })

async def send_password_reset_email(user_email: str, reset_token: str) -> None:
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={reset_token}"
    resend.Emails.send({
        "from": settings.EMAIL_FROM,
        "to": user_email,
        "subject": "Reset your password",
        "html": _render("password_reset", reset_url=reset_url, expires_minutes=30),
    })
```

### Step 4 - Async Sending via Celery (Critical)
Do NOT call email service functions synchronously in a request handler. If Resend is slow, your API becomes slow. Use a background task queue.

```python
# tasks/email_tasks.py
from celery import shared_task
from src.services.email_service import send_welcome_email as _send_welcome

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def task_send_welcome_email(self, user_email: str, display_name: str) -> None:
    try:
        import asyncio
        asyncio.run(_send_welcome(user_email, display_name))
    except Exception as exc:
        raise self.retry(exc=exc)  # auto-retry up to 3 times with 60s delay
```

**In the signup service (fire-and-forget):**
```python
from tasks.email_tasks import task_send_welcome_email

async def create_user(user_in: UserCreate, db: AsyncSession) -> UserOut:
    user = await user_repo.create(db, user_in)
    task_send_welcome_email.delay(user.email, user.display_name)  # non-blocking
    return UserOut.model_validate(user)
```

### Step 5 - Password Reset Flow
```python
# services/auth_service.py
import secrets, hashlib

async def initiate_password_reset(email: str, db: AsyncSession) -> None:
    user = await user_repo.get_by_email(db, email)
    if not user:
        return  # Don't reveal whether email exists (prevents user enumeration)

    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

    await password_reset_repo.create(db, user.id, token_hash, expires_at)
    task_send_password_reset_email.delay(user.email, raw_token)

async def complete_password_reset(raw_token: str, new_password: str, db: AsyncSession) -> None:
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    reset = await password_reset_repo.get_valid(db, token_hash)  # checks not expired, not used
    if not reset:
        raise HTTPException(400, "Reset link is invalid or expired")

    await user_repo.update_password(db, reset.user_id, hash_password(new_password))
    await password_reset_repo.mark_used(db, reset.id)
```
