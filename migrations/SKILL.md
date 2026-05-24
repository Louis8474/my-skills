---
name: migrations
description: "Manages database schema changes using Alembic — generates migration files, reviews them for safety, runs them in the right order, and handles rollbacks. Use when adding a new table, modifying columns, adding indexes, or renaming anything in the database. Trigger when the user mentions \"migration\", \"alembic\", \"schema change\", \"add column\", \"rename table\", \"database version\", or \"upgrade/downgrade database\". This skill prevents the most common data-loss mistakes: running migrations in production without a backup, generating empty migrations, and forgetting to handle nullability on existing rows."
---

# Migrations Engineering (Alembic)

## Purpose
Database migrations are irreversible in production. A dropped column is gone. A bad NOT NULL constraint on an existing table fails at runtime when the migration runs. This skill enforces a review-before-apply workflow that catches these problems before they cost you data or a production incident.

## SOP: Alembic Workflow

### Step 1 - Alembic Setup (First Time Only)
```bash
alembic init alembic
```

**`alembic/env.py` (configure for async + your models):**
```python
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.ext.asyncio import async_engine_from_config
from alembic import context
from src.database import Base
from src.models import *  # noqa - import all models so Alembic sees them

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
target_metadata = Base.metadata

async def run_migrations_online():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

def do_run_migrations(connection):
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()
```

### Step 2 - Generate a Migration
```bash
# After modifying a SQLAlchemy model:
alembic revision --autogenerate -m "add_user_bio_column"
```

**Immediately review the generated file before applying it.** Autogenerate is good but not perfect. Look for:

| Red Flag | What to Do |
|---|---|
| `op.drop_table(...)` or `op.drop_column(...)` | Confirm intentional. Add a DB backup step in your deploy SOP before this migration. |
| `op.add_column(..., nullable=False)` on a non-empty table | This will FAIL. Use `nullable=True` first, backfill, then `alter_column` to NOT NULL. |
| Empty `upgrade()` body | Alembic missed your change. Check that the model is imported in `env.py`. |
| Renamed column detected as drop+add | Set `compare_type=True` in `context.configure()` and check if it's a true rename or drop. |

### Step 3 - Safe NOT NULL Migration (3-Step Pattern)
Never add a NOT NULL column to an existing table in a single migration. This is the #1 migration foot-gun:

```python
# BAD - will fail if table has existing rows:
op.add_column("users", sa.Column("bio", sa.String(500), nullable=False))

# GOOD - split into 3 migrations:

# Migration 1: Add as nullable
op.add_column("users", sa.Column("bio", sa.String(500), nullable=True))

# Migration 2 (separate): Backfill existing rows
op.execute("UPDATE users SET bio = '' WHERE bio IS NULL")

# Migration 3 (separate): Now safe to enforce NOT NULL
op.alter_column("users", "bio", nullable=False)
```

### Step 4 - Apply Migrations
```bash
# Apply all pending migrations (local dev)
alembic upgrade head

# Apply one at a time (careful production deploy)
alembic upgrade +1

# Check current state
alembic current

# See pending
alembic history --indicate-current
```

### Step 5 - Rollback
```bash
alembic downgrade -1    # roll back one migration
alembic downgrade <revision_id>  # roll back to a specific revision
```

**Every migration's `downgrade()` function must be implemented.** An empty `downgrade()` means you cannot recover from a bad migration. Alembic autogenerate provides a starting point — always check it is correct.

### Step 6 - Production Migration SOP
Run this checklist before applying migrations to a production database:

```
[ ] Run migrations on staging first with a copy of production data
[ ] Verify staging app works correctly after migration
[ ] Take a database backup before running on production (RDS: create snapshot)
[ ] Put the app in maintenance mode if the migration holds exclusive table locks
[ ] Run: alembic upgrade head
[ ] Verify: alembic current (should show head)
[ ] Smoke test: 3 key user flows that touch the migrated tables
[ ] If anything is wrong: alembic downgrade -1 (then investigate)
```

### Step 7 - Adding an Index (Non-Blocking)
Adding an index on a large table takes a lock that blocks reads and writes. In PostgreSQL, use `CONCURRENTLY`:

```python
# In the migration:
def upgrade():
    op.execute("CREATE INDEX CONCURRENTLY ix_orders_status ON orders (status)")

def downgrade():
    op.execute("DROP INDEX CONCURRENTLY ix_orders_status")
```

Do **not** use `op.create_index()` for large production tables - it acquires a full table lock.
