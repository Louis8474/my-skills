---
name: api
description: Designs and implements HTTP APIs in Python using FastAPI (REST) or Strawberry (GraphQL). Enforces contract-first design, standard response envelopes, authentication dependency injection, and rate limiting. Trigger when building API endpoints, designing schemas, or handling client-server communication. Always choose REST vs GraphQL based on application complexity.
---

# API Engineering

## Default Stack (Ask First)
Before applying anything, ask:
> "Can I use FastAPI for this API? And should I use REST or GraphQL? I'll choose based on your app's complexity."

**API Style Decision Rule:**
- Use **FastAPI REST** when: the app is primarily CRUD, data is flat or lightly relational, a single known client (your own frontend) consumes it.
- Use **Strawberry GraphQL** when: multiple clients consume different data shapes, entities are deeply relational (User -> Orders -> Products -> Reviews), or a mobile client needs field-level data efficiency.

If unsure, default to REST. Migrating from REST to GraphQL is less painful than over-engineering a GraphQL schema for a simple CRUD app.

## Progressive Disclosure
- Load `references/fastapi-rest.md` for advanced REST patterns (pagination, filtering, OpenAPI customization).
- Load `references/graphql-strawberry.md` for GraphQL schema, resolver, and dataloader patterns.

## SOP: FastAPI REST Implementation

### Step 1 - Contract-First Design
Define the OpenAPI schema *before* writing routes. Describe the endpoint in terms of:
- HTTP method and path (e.g., `POST /api/v1/users/{id}/avatar`)
- Request body Pydantic model
- Response Pydantic model
- Status codes and error cases

FastAPI will auto-generate the OpenAPI spec from your code. Treat the generated spec as the contract - do not break it without a version bump.

### Step 2 - Standard Response Envelopes
All endpoints return a consistent envelope. Never return a raw model.

**Success:**
```python
# schemas/common.py
from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")

class SuccessResponse(BaseModel, Generic[T]):
    data: T
    meta: dict = {}

class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    meta: dict  # {"total": 100, "page": 1, "per_page": 20}
```

**Error:**
```python
class ErrorDetail(BaseModel):
    code: str      # machine-readable: "USER_NOT_FOUND"
    message: str   # human-readable: "User with id ... was not found"

class ErrorResponse(BaseModel):
    error: ErrorDetail
```

### Step 3 - Route Structure
```python
# api/v1/users.py
from fastapi import APIRouter, Depends, status
from uuid import UUID

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("", response_model=SuccessResponse[UserOut], status_code=status.HTTP_201_CREATED)
async def create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),  # auth gate
) -> SuccessResponse[UserOut]:
    user = await user_service.create(body, db)
    return SuccessResponse(data=user)
```

Routers are thin. All logic lives in the service layer.

### Step 4 - Authentication Dependency
```python
# dependencies/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    payload = decode_jwt(token)  # raises if invalid/expired
    user = await user_repo.get_by_id(db, UUID(payload["sub"]))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return user
```

Inject `Depends(get_current_user)` on any route that requires authentication. Never check auth manually inside a route handler.

### Step 5 - Rate Limiting
```python
# main.py
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# On route:
@router.post("")
@limiter.limit("10/minute")
async def create_user(request: Request, ...):
```

Apply stricter limits on auth endpoints (`5/minute`) and looser limits on read endpoints (`60/minute`).

### Step 6 - Versioning
All routes live under `/api/v1/`. When breaking changes are required, create `/api/v2/` routers. Never silently break existing contract. Deprecate with an `X-Deprecated: true` response header before removal.

---

## SOP: Strawberry GraphQL Implementation

### Step 1 - Schema-First Design
Define the GraphQL SDL conceptually before writing Python:
```graphql
type User {
  id: ID!
  email: String!
  orders: [Order!]!
}
type Query {
  user(id: ID!): User
}
type Mutation {
  createUser(input: CreateUserInput!): User!
}
```

Then implement in Strawberry:

```python
import strawberry
from uuid import UUID

@strawberry.type
class UserType:
    id: UUID
    email: str

    @strawberry.field
    async def orders(self, info: strawberry.types.Info) -> list["OrderType"]:
        return await info.context["order_loader"].load(self.id)
```

### Step 2 - N+1 Prevention with Dataloaders
Every relationship field on a GraphQL type must use a dataloader:

```python
from strawberry.dataloader import DataLoader

async def load_orders_by_user_id(user_ids: list[UUID]) -> list[list[Order]]:
    # Single DB query for all user_ids
    rows = await order_repo.get_by_user_ids(db, user_ids)
    by_user = {uid: [] for uid in user_ids}
    for row in rows:
        by_user[row.user_id].append(row)
    return [by_user[uid] for uid in user_ids]

order_loader = DataLoader(load_fn=load_orders_by_user_id)
```

Never resolve relationships with individual per-record DB queries.

### Step 3 - Context and Auth
```python
from strawberry.fastapi import GraphQLRouter

async def get_context(request: Request, db: AsyncSession = Depends(get_db)) -> dict:
    return {"db": db, "user": await get_current_user_optional(request), "order_loader": DataLoader(...)}

graphql_app = GraphQLRouter(schema, context_getter=get_context)
```
