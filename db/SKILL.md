---
name: db
description: Designs relational database schemas, writes optimized SQL queries, manages Alembic migrations, and configures RxDB for offline-first client-side applications. Use for all data modeling, schema design, query optimization, and migration tasks. Always confirm the existing stack before applying PostgreSQL or RxDB defaults.
---

# Database Engineering

## Default Stack (Ask First)
Before applying anything, ask:
> "Can I use the Supernova database stack? PostgreSQL 16 via SQLAlchemy 2.0 async for server-side, and RxDB v15 for client-side offline-first apps. Or do you have an existing database setup I should match?"

If a `DATABASE_URL` is already in `.env`, or an existing migration history exists, detect and match it.

## Progressive Disclosure
- Load `references/postgres-advanced.md` for complex scenarios: JSONB indexing, full-text search, row-level security, CTEs.
- Load `references/rxdb.md` for offline-first client schema, replication protocol, and conflict resolution setup.

## SOP: PostgreSQL + SQLAlchemy 2.0 Async

### Step 1 - SQLAlchemy ORM Model Conventions
```python
# models/base.py
from sqlalchemy.orm import DeclarativeBase, MappedColumn, mapped_column
from sqlalchemy import func
from uuid import UUID, uuid4
from datetime import datetime

class Base(DeclarativeBase):
    pass

# models/user.py
from sqlalchemy.orm import Mapped
from sqlalchemy import String, DateTime, text

class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4, server_default=text("gen_random_uuid()"))
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
```

**Model Conventions:**
- Every table has `id` (UUID PK), `created_at`, `updated_at` as standard columns.
- Use `Mapped[type]` and `mapped_column()` (SQLAlchemy 2.0 style). Never use the 1.x `Column()` style.
- FK column naming: `{entity}_id` (e.g., `user_id`, `order_id`).
- Use `String` with explicit max lengths, not `Text`, unless unbounded text is genuinely needed.

### Step 2 - Relationships
```python
from sqlalchemy.orm import relationship

class User(Base):
    # ...
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="user", cascade="all, delete-orphan")

class Order(Base):
    # ...
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    user: Mapped["User"] = relationship("User", back_populates="orders")
```

Always define `ondelete` behavior on FKs. `CASCADE` for child data, `SET NULL` for optional references, `RESTRICT` (default) when the parent must not be deleted while children exist.

### Step 3 - Alembic Migration Workflow
```bash
# 1. Generate migration (always auto-generate, never write migrations manually)
alembic revision --autogenerate -m "add_users_table"

# 2. Review the generated file in alembic/versions/. Always read it before applying.
# Check: are the correct columns added? Is upgrade() reversible by downgrade()?

# 3. Apply to development
alembic upgrade head

# 4. Apply to production (in CI/CD, not manually)
alembic upgrade head
```

**Migration rules:**
- Every `upgrade()` must have a working `downgrade()`.
- Never edit a migration that has been applied in production. Create a new migration instead.
- Migration filenames auto-generate a hash. Add a descriptive suffix: `2024_add_users_table.py`.

### Step 4 - Index Strategy
Add indexes based on actual query patterns. The default indexes to add:

| Scenario | Index Type | Example |
|---|---|---|
| FK column (always) | B-Tree | `index=True` on `user_id` FK |
| Email lookup / unique constraint | B-Tree | `unique=True` on `email` |
| Status column with low cardinality | Partial B-Tree | `CREATE INDEX ON orders (status) WHERE status = 'pending'` |
| Full-text search on title/description | GIN | `CREATE INDEX ON articles USING GIN (to_tsvector('english', title))` |
| JSONB field lookup | GIN | `CREATE INDEX ON products USING GIN (metadata jsonb_path_ops)` |

Never add indexes blindly on every column. Indexes slow down writes. Add them where `EXPLAIN ANALYZE` shows a sequential scan on a table with >10k rows.

### Step 5 - Repository Pattern
```python
# repositories/user_repo.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from uuid import UUID

class UserRepository:
    async def get_by_id(self, db: AsyncSession, user_id: UUID) -> User | None:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    async def get_by_email(self, db: AsyncSession, email: str) -> User | None:
        result = await db.execute(select(User).where(User.email == email))
        return result.scalar_one_or_none()

    async def create(self, db: AsyncSession, user: User) -> User:
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user
```

All DB queries live exclusively in repository files. Services call repositories. Routers never import `AsyncSession` or `select`.

### Step 6 - Query Anti-Patterns to Avoid
- `SELECT *` - always specify columns or use the ORM model to fetch only what is needed.
- Calling `session.execute()` in a loop - this produces N+1 queries. Use `selectinload()` or `joinedload()` for relationships.
- Implicit type casting in WHERE clauses (e.g., comparing UUID FK to a string) - will cause full table scans.
- Not wrapping multi-statement operations in a transaction.

---

## SOP: RxDB v15 (Client-Side Offline-First)

Use RxDB when the frontend application needs to work offline, sync data on reconnect, or provide an instant-response local-first experience.

### Step 1 - Schema Definition
```typescript
// db/schemas/user.schema.ts
import { RxJsonSchema } from "rxdb";

export const UserSchema: RxJsonSchema<{ id: string; email: string; displayName: string }> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 36 },
    email: { type: "string" },
    displayName: { type: "string" },
  },
  required: ["id", "email", "displayName"],
};
```

`version` starts at `0` and increments on schema changes. Breaking schema changes require a migration strategy.

### Step 2 - Database Initialization
```typescript
// db/index.ts
import { createRxDatabase, addRxPlugin } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";

if (process.env.NODE_ENV !== "production") addRxPlugin(RxDBDevModePlugin);

export async function createDb() {
  const db = await createRxDatabase({ name: "myapp", storage: getRxStorageDexie() });
  await db.addCollections({ users: { schema: UserSchema } });
  return db;
}
```

### Step 3 - Replication with Backend
```typescript
import { replicateRxCollection } from "rxdb/plugins/replication";

replicateRxCollection({
  collection: db.users,
  replicationIdentifier: "user-sync",
  pull: {
    async handler(checkpointOrNull, batchSize) {
      const res = await fetch(`/api/v1/sync/users?checkpoint=${checkpointOrNull}&limit=${batchSize}`);
      return res.json(); // { documents: [], checkpoint: ... }
    },
  },
  push: {
    async handler(rows) {
      await fetch("/api/v1/sync/users", { method: "POST", body: JSON.stringify(rows) });
      return [];
    },
  },
});
```

The sync endpoint on the FastAPI backend must implement the RxDB checkpoint replication protocol.
