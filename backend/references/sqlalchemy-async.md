# SQLAlchemy 2.0 Async Reference

## Session Factory Setup
```python
# database.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

engine = create_async_engine(
    settings.DATABASE_URL,           # postgresql+asyncpg://...
    echo=settings.DEBUG,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,              # reconnect on stale connections
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    expire_on_commit=False,          # prevent DetachedInstanceError after commit
    class_=AsyncSession,
)
```

## Complex Queries

### Eager Loading Relationships (prevent N+1)
```python
from sqlalchemy import select
from sqlalchemy.orm import selectinload, joinedload

# selectinload: separate IN query per relationship (best for collections)
stmt = select(User).options(selectinload(User.orders))
result = await db.execute(stmt)
users = result.scalars().all()

# joinedload: single JOIN query (best for single/many-to-one)
stmt = select(Order).options(joinedload(Order.user))
result = await db.execute(stmt)
orders = result.unique().scalars().all()  # unique() required after join
```

### Pagination
```python
from sqlalchemy import select, func

async def get_paginated(db: AsyncSession, offset: int, limit: int) -> tuple[int, list[Product]]:
    count_stmt = select(func.count()).select_from(Product)
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = select(Product).offset(offset).limit(limit).order_by(Product.created_at.desc())
    products = (await db.execute(stmt)).scalars().all()
    return total, products
```

### Filtering with Optional Parameters
```python
async def search_products(db: AsyncSession, name: str | None, min_price: float | None) -> list[Product]:
    stmt = select(Product)
    if name:
        stmt = stmt.where(Product.name.ilike(f"%{name}%"))
    if min_price is not None:
        stmt = stmt.where(Product.price >= min_price)
    return (await db.execute(stmt)).scalars().all()
```

## Transactions
```python
# Multi-statement transaction - all succeed or all roll back
async def create_order_with_items(order_in: OrderCreate, db: AsyncSession):
    async with db.begin():           # auto-commits on exit, rolls back on exception
        order = Order(**order_in.model_dump(exclude={"items"}))
        db.add(order)
        await db.flush()             # assigns order.id without committing

        for item_in in order_in.items:
            item = OrderItem(order_id=order.id, **item_in.model_dump())
            db.add(item)
        # commit happens when context exits cleanly
    return order
```

## UPSERT Pattern
```python
from sqlalchemy.dialects.postgresql import insert as pg_insert

async def upsert_user_preference(db: AsyncSession, user_id: UUID, key: str, value: str):
    stmt = pg_insert(UserPreference).values(user_id=user_id, key=key, value=value)
    stmt = stmt.on_conflict_do_update(
        index_elements=["user_id", "key"],
        set_={"value": value, "updated_at": func.now()}
    )
    await db.execute(stmt)
    await db.commit()
```

## Bulk Operations
```python
# Bulk insert - much faster than individual db.add() in a loop
from sqlalchemy import insert

async def bulk_create_tags(db: AsyncSession, tags: list[dict]) -> None:
    await db.execute(insert(Tag), tags)
    await db.commit()
```
