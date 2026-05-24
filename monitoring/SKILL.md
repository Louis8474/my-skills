---
name: monitoring
description: Sets up production observability — error tracking with Sentry, structured logging with structlog, application metrics with Prometheus, and uptime monitoring. Use when preparing an app for production, debugging production issues, or when the user has no visibility into what's failing in their live app. Trigger when user mentions "Sentry", "error tracking", "monitoring", "logging", "metrics", "alerts", "production issues", "how do I know when something breaks", or "observability".
---

# Monitoring Engineering

## Purpose
Vibe-coders ship apps and have no idea what's happening in production. Users encounter errors silently. Slow endpoints go unnoticed. This skill sets up the minimum viable observability layer so that when something breaks, you know about it before the user complains.

## Monitoring Stack

| Layer | Tool | What it catches |
|---|---|---|
| Error tracking | **Sentry** | Exceptions, stack traces, user context |
| Structured logs | **structlog** | Request logs, audit events, debug traces |
| App metrics | **Prometheus + Grafana** | Latency, throughput, error rates |
| Uptime | **BetterStack / UptimeRobot** | Is the server even responding? |

Start with Sentry (10 min setup, immediate value). Add Prometheus when you have enough traffic to need dashboards.

## SOP: Sentry Integration

### Step 1 - Backend (FastAPI)
```bash
uv pip install sentry-sdk[fastapi]
```

```python
# main.py
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,            # from Sentry dashboard
    environment=settings.ENV,           # "production", "staging", "development"
    traces_sample_rate=0.1,             # capture 10% of requests for performance tracing
    profiles_sample_rate=0.1,
    integrations=[FastApiIntegration(), SqlalchemyIntegration()],
    send_default_pii=False,             # never send passwords, credit cards, etc.
)
```

Sentry auto-captures unhandled exceptions from this point. No code changes needed to track errors.

**Manually capture handled errors with context:**
```python
import sentry_sdk

async def process_payment(order_id: UUID, user: User):
    try:
        await stripe_service.charge(order)
    except stripe.error.CardError as e:
        sentry_sdk.set_user({"id": str(user.id), "email": user.email})
        sentry_sdk.capture_exception(e)
        raise HTTPException(402, "Payment declined")
```

### Step 2 - Frontend (Next.js)
```bash
npx @sentry/wizard@latest -i nextjs
```

The wizard creates `sentry.client.config.ts`, `sentry.server.config.ts`, and patches `next.config.js`. After running it:

```ts
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,  // always capture session replay on error
});
```

**Wrap the root layout for error boundaries:**
```tsx
// app/global-error.tsx
"use client";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  Sentry.captureException(error);
  return (
    <html><body>
      <h2>Something went wrong</h2>
      <button onClick={() => reset()}>Try again</button>
    </body></html>
  );
}
```

### Step 3 - Structured Logging (structlog)
```python
# logging_config.py
import structlog
import logging

def configure_logging(debug: bool = False):
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.add_log_level,
            structlog.stdlib.add_logger_name,
            structlog.dev.ConsoleRenderer() if debug else structlog.processors.JSONRenderer(),
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
    logging.basicConfig(level=logging.DEBUG if debug else logging.INFO)

# In main.py lifespan:
configure_logging(debug=settings.DEBUG)
```

**Usage:**
```python
log = structlog.get_logger()

# Always log structured key-value pairs, never f-strings for log lines
log.info("order_created", order_id=str(order.id), user_id=str(user.id), amount=order.total)
log.error("payment_failed", order_id=str(order_id), error_code=e.code, exc_info=True)
```

In production, logs are JSON - they can be searched by field name in any log aggregator (Datadog, CloudWatch, Loki).

### Step 4 - Prometheus Metrics (FastAPI)
```bash
uv pip install prometheus-fastapi-instrumentator
```

```python
# main.py
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator().instrument(app).expose(app, endpoint="/metrics")
```

This auto-exposes `/metrics` with request count, latency histograms, and error rates per endpoint. Connect Prometheus to scrape `/metrics` and Grafana to visualize.

### Step 5 - Health Check Endpoint (Required for k8s + Uptime Monitoring)
```python
@app.get("/health", include_in_schema=False)
async def health(db: AsyncSession = Depends(get_db)):
    # Check DB connection
    try:
        await db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "error"

    status = "ok" if db_status == "ok" else "degraded"
    return {"status": status, "db": db_status, "version": settings.APP_VERSION}
```

Point BetterStack / UptimeRobot at `https://your-api.com/health` with a 1-minute check interval.

### Step 6 - Alerts
Configure in Sentry dashboard:
- Alert when error rate > 1% of requests
- Alert when latency P95 > 2 seconds
- Alert on any new error type (first occurrence)

All alerts route to Slack or email. Production incidents should wake someone up.
