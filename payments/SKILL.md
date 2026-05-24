---
name: payments
description: Implements Stripe payment integration including one-time charges, subscription billing, webhook handling, and failed payment recovery. Use when adding any payment functionality — checkout flows, subscription plans, refunds, invoices, or proration. Trigger when the user mentions "Stripe", "payments", "subscriptions", "billing", "checkout", "invoice", or "credit card". This skill covers the full payment lifecycle including the security-critical webhook verification step that vibe-coders almost always skip.
---

# Payments Engineering (Stripe)

## Purpose
Payments are the most consequential code in any SaaS. A bug here is not a UX problem — it is a financial, legal, and trust problem. This skill does not treat Stripe as a simple API call. It treats payment flows as state machines with explicit error handling, idempotency, and webhook-first architecture.

## Payment Type Decision
Before writing any code, identify which Stripe flow applies:

| User Need | Stripe Flow |
|---|---|
| User pays once (product, service, credit) | Payment Intent + Checkout Session |
| User pays monthly/yearly (SaaS) | Subscription + Prices + Customer |
| Cancel and get money back | Refunds API |
| Custom invoice / usage-based | Invoice API + Meter |

## SOP: Stripe Integration

### Step 1 - Setup and Keys
```bash
uv pip install stripe
```

```python
# config.py (via pydantic-settings)
class Settings(BaseSettings):
    STRIPE_SECRET_KEY: str          # sk_live_... or sk_test_...
    STRIPE_PUBLISHABLE_KEY: str     # pk_live_...
    STRIPE_WEBHOOK_SECRET: str      # whsec_...  (from Stripe Dashboard > Webhooks)
```

**Never hardcode keys. Keys live in environment variables only.**

### Step 2 - Stripe Client (Singleton)
```python
# integrations/stripe_client.py
import stripe
from src.config import settings

stripe.api_key = settings.STRIPE_SECRET_KEY
stripe.api_version = "2024-06-20"  # pin the API version - never use "latest"

# Re-export so callers import from here, not directly from stripe
__all__ = ["stripe"]
```

### Step 3 - Checkout Session (One-Time Payment)
```python
# services/payment_service.py
from integrations.stripe_client import stripe
from uuid import UUID

async def create_checkout_session(order_id: UUID, amount_cents: int, user_email: str) -> str:
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{
            "price_data": {
                "currency": "usd",
                "unit_amount": amount_cents,
                "product_data": {"name": "Order Payment"},
            },
            "quantity": 1,
        }],
        mode="payment",
        success_url=f"{settings.FRONTEND_URL}/orders/{order_id}/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{settings.FRONTEND_URL}/orders/{order_id}/cancel",
        customer_email=user_email,
        metadata={"order_id": str(order_id)},  # CRITICAL: link Stripe session to your DB record
        idempotency_key=str(order_id),          # safe to retry if the request fails
    )
    return session.url
```

### Step 4 - Subscription Billing
```python
async def create_subscription(user: User, price_id: str, db: AsyncSession) -> str:
    """price_id is the Stripe Price ID (e.g., price_1ABC...) from your dashboard."""
    # Create or retrieve Stripe Customer
    if not user.stripe_customer_id:
        customer = stripe.Customer.create(email=user.email, metadata={"user_id": str(user.id)})
        await user_repo.set_stripe_customer_id(db, user.id, customer.id)
        customer_id = customer.id
    else:
        customer_id = user.stripe_customer_id

    # Create Checkout Session for subscription
    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{settings.FRONTEND_URL}/billing/success",
        cancel_url=f"{settings.FRONTEND_URL}/billing",
        subscription_data={"metadata": {"user_id": str(user.id)}},
    )
    return session.url
```

### Step 5 - Webhook Handler (The Critical Part)
Webhooks are how Stripe tells your server that a payment succeeded. If you only check the redirect URL after checkout, you have a race condition. **The canonical source of truth is the webhook, not the redirect.**

```python
# api/v1/webhooks.py
from fastapi import APIRouter, Request, HTTPException
from integrations.stripe_client import stripe
from src.config import settings

router = APIRouter()

@router.post("/webhooks/stripe", include_in_schema=False)
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    # Step 1: Verify the webhook came from Stripe (NEVER skip this)
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    # Step 2: Use event type to route to the correct handler
    event_type = event["type"]
    data = event["data"]["object"]

    # Step 3: Idempotency - always check if you've already processed this event
    if await webhook_event_repo.exists(db, event["id"]):
        return {"status": "already_processed"}  # Stripe retries on non-2xx - return 200

    match event_type:
        case "checkout.session.completed":
            order_id = data["metadata"]["order_id"]
            await order_service.mark_paid(UUID(order_id), db)

        case "customer.subscription.created" | "customer.subscription.updated":
            user_id = data["metadata"]["user_id"]
            await subscription_service.sync_subscription(UUID(user_id), data, db)

        case "customer.subscription.deleted":
            user_id = data["metadata"]["user_id"]
            await subscription_service.cancel_subscription(UUID(user_id), db)

        case "invoice.payment_failed":
            # Notify the user, optionally trigger dunning logic
            customer_id = data["customer"]
            await email_service.send_payment_failed_notice(customer_id, db)

    await webhook_event_repo.create(db, event["id"], event_type)
    return {"status": "ok"}
```

**Webhook best practices:**
- Register the route BEFORE any auth middleware (Stripe doesn't send auth headers)
- Return `200 OK` even for events you don't handle - otherwise Stripe retries forever
- Store processed event IDs to prevent duplicate processing
- In `docker-compose.yml` for local dev, use [Stripe CLI]: `stripe listen --forward-to localhost:8000/api/v1/webhooks/stripe`

### Step 6 - Refunds
```python
async def create_refund(payment_intent_id: str, amount_cents: int | None = None) -> stripe.Refund:
    """amount_cents=None refunds the full amount."""
    return stripe.Refund.create(
        payment_intent=payment_intent_id,
        amount=amount_cents,  # partial refund if specified
        reason="requested_by_customer",
    )
    # Then update your DB order status to 'refunded' via webhook: charge.refunded
```

### Step 7 - Frontend (Next.js Checkout Button)
```tsx
// app/checkout/page.tsx (client component)
"use client";

export function CheckoutButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);
    const res = await fetch(`/api/orders/${orderId}/checkout`, { method: "POST" });
    const { checkout_url } = await res.json();
    window.location.href = checkout_url; // redirect to Stripe-hosted checkout
  }
  return <Button onClick={handleCheckout} disabled={loading}>
    {loading ? "Redirecting..." : "Pay Now"}
  </Button>;
}
```

### DB Schema Additions Required
```python
# Add to User model:
stripe_customer_id: Mapped[str | None] = mapped_column(String, nullable=True, unique=True)

# New table:
class WebhookEvent(Base):
    __tablename__ = "webhook_events"
    id: Mapped[str] = mapped_column(String, primary_key=True)  # Stripe event ID
    event_type: Mapped[str] = mapped_column(String, nullable=False)
    processed_at: Mapped[datetime] = mapped_column(default=func.now())
```
