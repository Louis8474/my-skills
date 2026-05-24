# Stripe Reference: Webhook Events Cheatsheet

## Critical Events to Handle

| Event | When It Fires | Action Required |
|---|---|---|
| `checkout.session.completed` | User completes checkout (payment captured) | Mark order paid, provision access |
| `customer.subscription.created` | New subscription started | Update user plan in DB |
| `customer.subscription.updated` | Plan changed, trial ended, payment method updated | Sync subscription data |
| `customer.subscription.deleted` | Subscription cancelled (immediately or at period end) | Revoke access |
| `invoice.payment_failed` | Recurring payment declined | Notify user, start dunning |
| `invoice.payment_succeeded` | Recurring payment collected | Log for accounting |
| `charge.refunded` | Refund processed | Update order status |
| `payment_intent.payment_failed` | One-time payment failed | Notify user |

## Webhook Event Object Shape (Key Fields)

```json
{
  "id": "evt_1ABC...",
  "type": "checkout.session.completed",
  "created": 1700000000,
  "data": {
    "object": {
      "id": "cs_1ABC...",
      "metadata": { "order_id": "your-db-uuid" },
      "customer": "cus_1ABC...",
      "customer_email": "user@example.com",
      "payment_intent": "pi_1ABC...",
      "subscription": "sub_1ABC...",
      "amount_total": 9900
    }
  }
}
```

## Testing Webhooks Locally

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
2. Forward events to local server:
   ```bash
   stripe listen --forward-to localhost:8000/api/v1/webhooks/stripe
   ```
3. The CLI prints a webhook signing secret — use this as `STRIPE_WEBHOOK_SECRET` in `.env` during dev.
4. Trigger specific events for testing:
   ```bash
   stripe trigger checkout.session.completed
   stripe trigger customer.subscription.deleted
   stripe trigger invoice.payment_failed
   ```

## Subscription Status Values

| Status | Meaning | Grant Access? |
|---|---|---|
| `active` | Current, paying subscriber | ✅ Yes |
| `trialing` | Free trial, payment method on file | ✅ Yes |
| `past_due` | Payment failed, retrying | ⚠️ Grace period (you decide) |
| `canceled` | Subscription ended | ❌ No |
| `incomplete` | Payment not yet completed | ❌ No |
| `unpaid` | Failed after all retries | ❌ No |

## Proration (Plan Changes)
When a user upgrades/downgrades mid-cycle, Stripe computes the prorated amount automatically. To do this via API:
```python
stripe.Subscription.modify(
    subscription_id,
    items=[{"id": current_item_id, "price": new_price_id}],
    proration_behavior="create_prorations",  # or "none" to apply at renewal
)
```

## Customer Portal (Self-Service Billing)
Let users manage their own subscriptions without you building UI:
```python
session = stripe.billing_portal.Session.create(
    customer=user.stripe_customer_id,
    return_url=f"{settings.FRONTEND_URL}/dashboard",
)
return {"url": session.url}
```
Redirect users to `session.url`. They can cancel, upgrade, update card, download invoices.
