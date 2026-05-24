# FastAPI Patterns Reference

## Dependency Injection Patterns

### Chained Dependencies
```python
# Inject auth then derive current user from it
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    ...

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
```

### Pagination Dependency
```python
from pydantic import BaseModel
from fastapi import Query

class PaginationParams(BaseModel):
    page: int = Query(default=1, ge=1)
    per_page: int = Query(default=20, ge=1, le=100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page

async def get_paginated_products(
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db)
) -> PaginatedResponse[ProductOut]:
    total, products = await product_service.get_paginated(db, pagination.offset, pagination.per_page)
    return PaginatedResponse(data=products, meta={"total": total, "page": pagination.page, "per_page": pagination.per_page})
```

---

## Middleware Patterns

### Request ID Middleware (for distributed tracing)
```python
import uuid
from starlette.middleware.base import BaseHTTPMiddleware

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response

app.add_middleware(RequestIDMiddleware)
```

### Structlog Context Middleware
```python
class LogContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        structlog.contextvars.clear_contextvars()
        structlog.contextvars.bind_contextvars(
            request_id=request.state.request_id,
            method=request.method,
            path=request.url.path,
        )
        return await call_next(request)
```

---

## Lifespan Events (startup/shutdown)
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await engine.dispose()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)  # dev only; use Alembic in prod
    yield
    # Shutdown
    await engine.dispose()

app = FastAPI(lifespan=lifespan)
```

---

## Error Handling

### Global Exception Handler
```python
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": "HTTP_ERROR", "message": exc.detail}}
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    log.error("unhandled_exception", exc_info=exc, path=request.url.path)
    return JSONResponse(status_code=500, content={"error": {"code": "INTERNAL_ERROR", "message": "An unexpected error occurred"}})
```

---

## Idempotency Key Pattern
For non-idempotent operations (payments, email sends, order creation):
```python
from fastapi import Header

@router.post("/orders", status_code=201)
async def create_order(
    body: OrderCreate,
    idempotency_key: str = Header(alias="Idempotency-Key"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    existing = await order_repo.get_by_idempotency_key(db, idempotency_key, current_user.id)
    if existing:
        return SuccessResponse(data=OrderOut.model_validate(existing))  # replay cached response
    order = await order_service.create(body, idempotency_key, current_user, db)
    return SuccessResponse(data=order)
```
