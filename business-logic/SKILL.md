---
name: business-logic
description: Designs and implements the core domain rules, service-layer workflows, state machines, and validation logic that define what an application actually does. Use when implementing rules that go beyond simple CRUD, modeling complex workflows (order processing, subscription billing, approval chains), or translating product requirements into enforceable system behavior. Trigger when a feature involves conditional rules, multi-step processes, state transitions, or calculations that have business meaning.
---

# Business Logic Engineering

## Purpose
Business logic is the layer where the product lives. It is the difference between "save a row to the database" (data access) and "process a refund only if the order was placed within 30 days and the product has not been shipped" (business rule). This skill exists because vibe-coders frequently collapse business rules into route handlers or database queries, making them invisible, untestable, and impossible to change without breaking something.

## SOP: Business Logic Design and Implementation

### Step 1 - Extract the Domain Rules First
Before writing any code, explicitly state every business rule in plain language. Ask the user:
1. What are the conditions that must be true for this action to succeed?
2. What happens when those conditions are not met?
3. Are there time-based rules? (e.g., "within 30 days", "before end of billing cycle")
4. Are there role-based rules? (e.g., "only admins can...", "only the resource owner can...")
5. What state changes happen as a result of this action?

Write these rules as numbered assertions before touching a keyboard:
```
Rules for "Process Refund":
1. Order must exist and belong to the requesting user.
2. Order must be in "completed" status (not "pending", "cancelled", or already "refunded").
3. Order must have been created within the last 30 days.
4. Refund amount cannot exceed the original order total.
5. If all above pass: order status -> "refunded", payment transaction created, email sent.
```

This list becomes the source of truth. Tests will verify each rule independently.

### Step 2 - Service Layer is Where Rules Live
Business logic belongs exclusively in the service layer. Never in route handlers, never in repositories, never in Pydantic models.

```
Router: "Received a refund request for order X from user Y"
Service: "Check rules 1-4. Execute rule 5 if all pass. Return result."
Repository: "Write the refund transaction to the DB"
```

**Why this matters:** If the same business rule is needed from a webhook handler, a background job, and an admin CLI, the service function is called in all three places. If the rule was in the router, you'd duplicate it three times.

### Step 3 - Implement Rules as Explicit Guards
Express each rule as a readable guard clause at the top of the service function:

```python
# services/order_service.py
from datetime import datetime, timedelta, timezone
from uuid import UUID
from fastapi import HTTPException

async def process_refund(order_id: UUID, amount: float, current_user: User, db: AsyncSession) -> RefundOut:
    # Rule 1: Order exists and belongs to user
    order = await order_repo.get_by_id(db, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Order not found")

    # Rule 2: Order must be in completed status
    if order.status != OrderStatus.COMPLETED:
        raise HTTPException(status_code=422, detail=f"Cannot refund order in '{order.status}' status")

    # Rule 3: Within 30-day window
    refund_window = timedelta(days=30)
    if datetime.now(timezone.utc) - order.created_at > refund_window:
        raise HTTPException(status_code=422, detail="Refund window of 30 days has expired")

    # Rule 4: Amount cannot exceed order total
    if amount > order.total_amount:
        raise HTTPException(status_code=422, detail=f"Refund amount {amount} exceeds order total {order.total_amount}")

    # Rule 5: Execute the refund (all guards passed)
    refund = await payment_service.issue_refund(order, amount, db)
    await order_repo.update_status(db, order_id, OrderStatus.REFUNDED)
    await email_service.send_refund_confirmation(order, refund)

    return RefundOut.model_validate(refund)
```

Each guard is readable, the reason for rejection is always explicit, and the "happy path" is at the bottom.

### Step 4 - State Machine Pattern
When a domain entity has a lifecycle with multiple states and allowed transitions, model it as an explicit state machine:

```python
# models/enums.py
from enum import StrEnum

class OrderStatus(StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    COMPLETED = "completed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"

# Define allowed transitions
VALID_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    OrderStatus.PENDING: {OrderStatus.CONFIRMED, OrderStatus.CANCELLED},
    OrderStatus.CONFIRMED: {OrderStatus.SHIPPED, OrderStatus.CANCELLED},
    OrderStatus.SHIPPED: {OrderStatus.COMPLETED},
    OrderStatus.COMPLETED: {OrderStatus.REFUNDED},
    OrderStatus.REFUNDED: set(),   # terminal
    OrderStatus.CANCELLED: set(),  # terminal
}

# services/order_service.py
def transition_order(order: Order, new_status: OrderStatus) -> None:
    allowed = VALID_TRANSITIONS.get(order.status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=422,
            detail=f"Cannot transition order from '{order.status}' to '{new_status}'. Allowed: {[s.value for s in allowed]}"
        )
    order.status = new_status
```

Never allow arbitrary status changes. Every transition must be explicitly permitted.

### Step 5 - Domain Events (Decoupling Side Effects)
When an action triggers multiple side effects (email, analytics, webhook, audit log), decouple them from the core logic using domain events. This keeps the service function focused on the core rule and makes side effects optional and testable independently:

```python
# events/order_events.py
from dataclasses import dataclass
from uuid import UUID

@dataclass
class OrderRefundedEvent:
    order_id: UUID
    user_id: UUID
    refund_amount: float

# In the service, after core logic:
await event_bus.publish(OrderRefundedEvent(
    order_id=order.id,
    user_id=current_user.id,
    refund_amount=amount
))

# Subscribers (registered separately):
event_bus.subscribe(OrderRefundedEvent, send_refund_email_handler)
event_bus.subscribe(OrderRefundedEvent, update_analytics_handler)
event_bus.subscribe(OrderRefundedEvent, notify_webhook_handler)
```

The service does not know or care about email, analytics, or webhooks. Each handler is independently testable.

### Step 6 - Business Rule Unit Tests
Every rule documented in Step 1 gets its own test. The test name maps directly to the rule:

```python
# tests/unit/test_order_service.py

@pytest.mark.asyncio
async def test_refund_fails_if_order_does_not_belong_to_user():
    ...
    with pytest.raises(HTTPException) as exc:
        await process_refund(order_id=other_user_order.id, amount=10.0, current_user=user, db=db)
    assert exc.value.status_code == 404

@pytest.mark.asyncio
async def test_refund_fails_if_order_is_already_refunded():
    ...

@pytest.mark.asyncio
async def test_refund_fails_if_outside_30_day_window():
    order.created_at = datetime.now(timezone.utc) - timedelta(days=31)
    ...

@pytest.mark.asyncio
async def test_refund_succeeds_and_transitions_order_to_refunded_status():
    ...
    assert result.status == "refunded"
```

Every rule from the plain-language list in Step 1 must have a corresponding failing test and a passing test.

### Step 7 - Calculation Logic
Never embed complex calculations inline. Extract them to pure functions that are independently testable:

```python
# services/pricing_service.py

def calculate_order_total(line_items: list[LineItem], discount_code: DiscountCode | None) -> float:
    subtotal = sum(item.unit_price * item.quantity for item in line_items)
    if discount_code and discount_code.discount_type == "percentage":
        discount = subtotal * (discount_code.discount_value / 100)
        subtotal -= discount
    # Tax is calculated on the post-discount subtotal
    tax = subtotal * TAX_RATE
    return round(subtotal + tax, 2)
```

Pure functions (no DB, no HTTP) with deterministic output are the easiest things to test and the most important to get right.
