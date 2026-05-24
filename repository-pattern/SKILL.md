---
name: repository-pattern
description: Use when building ORM-agnostic data access layers, implementing the Repository pattern for CRUD operations, or creating database adapters that work across multiple ORMs.
---

# Repository Pattern

Build ORM-agnostic data access by defining a standard `Repository` interface and implementing it per-ORM. The core library never touches SQL — it only knows the `Repository` contract.

## When to Use

- Building a toolkit that should work with any ORM
- Creating a standard CRUD layer that multiple services share
- Decoupling business logic from database implementation details
- Building a plugin system where the data layer is swappable

## The Pattern

### 1. Define the Repository Interface

```ts
export interface FindOptions {
  filters?: Record<string, any>
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>
  pagination?: { page: number; pageSize: number }
}

export interface Repository<T = any> {
  find(options: FindOptions): Promise<{ data: T[]; total: number }>
  findOne(id: string | number): Promise<T | null>
  create(data: Partial<T>): Promise<T>
  update(id: string | number, data: Partial<T>): Promise<T | null>
  delete(id: string | number): Promise<T | null>
}
```

**Key decisions:**
- `find` returns `{ data, total }` — pagination metadata alongside results
- `findOne` returns `T | null` — null-safe, no exceptions for missing records
- All IDs are `string | number` — works with UUIDs and auto-increment
- `T = any` default — concrete implementations should narrow this

### 2. Define the Repository Factory

```ts
export type RepositoryFactory = <T = any>(schemaName: string) => Repository<T>
```

A factory that takes a schema name and returns the appropriate repository instance. This enables multi-tenant / multi-resource setups where one factory produces repositories for all registered schemas.

### 3. Implement an ORM Adapter

#### Drizzle ORM Implementation

**IMPORTANT:** Use `getTableColumns(table)` instead of `(table as any)[field]` — it's Drizzle's official introspection API and gives type-safe column access.

```ts
import { FindOptions, Repository, SchemaDefinition } from './types'
import { buildWhereClause, buildOrderBy } from './query-builder'
import { eq, sql, getTableColumns } from 'drizzle-orm'

export class DrizzleRepository<T = any> implements Repository<T> {
  constructor(
    private db: any,
    private table: any,
    private schema: SchemaDefinition,
    private dialect: 'pg' | 'mysql' | 'sqlite' = 'sqlite',
  ) {}

  async find(options: FindOptions): Promise<{ data: T[]; total: number }> {
    let query = this.db.select().from(this.table)

    if (options.filters) {
      const whereClause = buildWhereClause(this.table, options.filters)
      if (whereClause) {
        query = query.where(whereClause) as any
      }
    }

    if (options.sort?.length) {
      query = query.orderBy(...buildOrderBy(this.table, options.sort)) as any
    }

    if (options.pagination) {
      const { page, pageSize } = options.pagination
      query = query
        .limit(pageSize)
        .offset((page - 1) * pageSize) as any
    }

    const data = await query

    // Count query (re-applies filters for accurate total)
    let countQuery = this.db
      .select({ count: sql<number>`count(*)` })
      .from(this.table)

    if (options.filters) {
      const whereClause = buildWhereClause(this.table, options.filters)
      if (whereClause) {
        countQuery = countQuery.where(whereClause) as any
      }
    }

    const [{ count: total }] = await countQuery
    return { data: data as T[], total }
  }

  async findOne(id: string | number): Promise<T | null> {
    const columns = getTableColumns(this.table)
    const pkColumn = columns.id || columns[Object.keys(columns)[0]]
    if (!pkColumn) throw new Error('No primary key column found')

    const [result] = await this.db
      .select()
      .from(this.table)
      .where(eq(pkColumn, id))
      .limit(1)
    return result as T | null
  }

  async create(data: Partial<T>): Promise<T> {
    if (this.schema.hooks?.repository?.beforeCreate) {
      data = await this.schema.hooks.repository.beforeCreate(data)
    }

    // MySQL doesn't support RETURNING — insert then fetch
    if (this.dialect === 'mysql') {
      const result = await this.db.insert(this.table).values(data as any)
      return this.findOne(result.insertId) as Promise<T>
    }

    const [result] = await this.db
      .insert(this.table)
      .values(data as any)
      .returning()

    if (this.schema.hooks?.repository?.afterCreate) {
      await this.schema.hooks.repository.afterCreate(result)
    }

    return result as T
  }

  async update(id: string | number, data: Partial<T>): Promise<T | null> {
    if (this.dialect === 'mysql') {
      await this.db.update(this.table).set(data as any).where(eq((this.table as any).id, id))
      return this.findOne(id)
    }

    const [result] = await this.db
      .update(this.table)
      .set(data as any)
      .where(eq((this.table as any).id, id))
      .returning()

    return result as T | null
  }

  async delete(id: string | number): Promise<T | null> {
    const existing = await this.findOne(id)
    if (!existing) return null

    await this.db.delete(this.table).where(eq((this.table as any).id, id))
    return existing
  }
}
```

### 3b. Abstract Repository Base Class

Instead of generating repositories dynamically, extend an abstract base class per-table. This gives you both CRUD defaults and custom methods:

```ts
export abstract class DrizzleRepository<T> implements IRepository<T> {
  constructor(
    protected db: typeof Database,
    protected tableSchema: SQLiteTable,
  ) {}

  async find(options: FindOptions): Promise<{ data: T[]; total: number }> { /* ... */ }
  async findOne(id: string | unknown): Promise<T | null> { /* ... */ }
  async create(data: Partial<T>): Promise<T> { /* ... */ }
  async update(id: string | unknown, data: Partial<T>): Promise<T | null> { /* ... */ }
  async delete(id: string | unknown): Promise<T | null> { /* ... */ }
}

// Concrete repository — extends base with custom methods
export class TenantRepository extends DrizzleRepository<Tenant>
  implements ITenantRepository
{
  constructor(protected db: typeof Database) {
    super(db, tenantTable)
  }

  async getActiveTenants(): Promise<{ data: Tenant[]; total: number }> {
    return this.find({
      filters: { status: { $eq: 'active' } },
      sort: [{ field: 'created_at', order: 'desc' }],
    })
  }
}
```

**When to use which approach:**
- **Abstract class** — when you need custom methods per entity (domain-specific queries)
- **Factory function** — when you want pure CRUD with zero boilerplate

### 3c. Query Parsing with `qs`

Use the `qs` library instead of manual string manipulation for nested query strings:

```ts
import qs from 'qs'

export const parseQueryString = (url: string) =>
  qs.parse(url.split('?')[1] ?? '', {
    allowDots: true,
    ignoreQueryPrefix: true,
  })

// Then validate with Zod:
const FindOptionsSchema = z.object({
  filters: z.lazy(() =>
    z.record(z.string(), z.unknown()).and(
      z.object({
        $and: z.array(z.lazy(() => FindOptionsSchema)).optional(),
        $or: z.array(z.lazy(() => FindOptionsSchema)).optional(),
      })
    )
  ).optional(),
  sort: z.array(
    z.object({
      field: z.string(),
      order: z.enum(['asc', 'desc']),
    })
  ).optional(),
  pagination: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
  }).optional(),
})

const parsed = FindOptionsSchema.parse(parseQueryString(request.url))
```

### 3d. Auto-Generate Zod Schemas from Drizzle Tables

Skip manual Zod schemas — `drizzle-zod` generates them from your table definitions:

```ts
import { createSelectSchema, createInsertSchema } from 'drizzle-zod'
import { z } from 'zod'

const selectUserSchema = createSelectSchema(usersTable)
const insertUserSchema = createInsertSchema(usersTable)

// Paginated response factory
const createPaginatedResponseSchema = <T extends SQLiteTable>(table: T) => {
  const rowSchema = createSelectSchema(table)
  return z.object({
    data: z.array(rowSchema),
    total: z.number(),
  })
}

// Usage in route validation:
validations: {
  response: {
    200: createPaginatedResponseSchema(usersTable),
  },
}
```

Operators for selective schema generation:

```ts
const updateUserSchema = createInsertSchema(usersTable).pick({
  name: true,
  email: true,
}).partial()
```

### 4. Factory Function

```ts
export function createDrizzleRepositoryFactory(
  db: any,
  schemas: SchemaRegistry,
  options?: { dialect?: 'pg' | 'mysql' | 'sqlite' }
): RepositoryFactory {
  return (schemaName: string): Repository => {
    const dialect = options?.dialect || 'sqlite'
    const schema = schemas[schemaName]
    if (!schema) {
      throw new Error(`Schema not found: ${schemaName}`)
    }
    return new DrizzleRepository(db, schema.tableName, schema, dialect)
  }
}
```

### 5. Query Builder for Strapi-Style Filters

Filter syntax: `filters[field][$eq]=value`, `filters[$and][0][name][$contains]=john`

Use `getTableColumns(table)` for type-safe column access.

```ts
import { SQL, and, or, eq, ne, gt, gte, lt, lte, like, ilike, inArray, notInArray, isNull, isNotNull, between, not, asc, desc, getTableColumns } from 'drizzle-orm'

export function buildWhereClause(
  table: any,
  filters: Record<string, any>
): SQL | undefined {
  const conditions: SQL[] = []

  for (const [field, value] of Object.entries(filters)) {
    if (field === '$and' && Array.isArray(value)) {
      const andConditions = value
        .map(f => buildWhereClause(table, f))
        .filter(Boolean) as SQL[]
      if (andConditions.length) conditions.push(and(...andConditions)!)
      continue
    }

    if (field === '$or' && Array.isArray(value)) {
      const orConditions = value
        .map(f => buildWhereClause(table, f))
        .filter(Boolean) as SQL[]
      if (orConditions.length) conditions.push(or(...orConditions)!)
      continue
    }

    const tableColumns = getTableColumns(table)
    const column = tableColumns[field]
    if (!column) {
      console.warn(`Unknown field: ${field}`)
      continue
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      for (const [operator, operatorValue] of Object.entries(value)) {
        const condition = applyOperator(column, operator, operatorValue)
        if (condition) conditions.push(condition)
      }
    } else {
      conditions.push(eq(column, value))
    }
  }

  return conditions.length ? and(...conditions) : undefined
}

function applyOperator(column: any, operator: string, value: any): SQL | undefined {
  switch (operator) {
    case '$eq':          return eq(column, value)
    case '$ne':          return ne(column, value)
    case '$gt':          return gt(column, value)
    case '$gte':         return gte(column, value)
    case '$lt':          return lt(column, value)
    case '$lte':         return lte(column, value)
    case '$in':          return Array.isArray(value) ? inArray(column, value) : undefined
    case '$notIn':       return Array.isArray(value) ? notInArray(column, value) : undefined
    case '$contains':    return like(column, `%${value}%`)
    case '$notContains': return not(like(column, `%${value}%`))
    case '$containsi':   return ilike(column, `%${value}%`)
    case '$startsWith':  return like(column, `${value}%`)
    case '$endsWith':    return like(column, `%${value}`)
    case '$null':        return value === true ? isNull(column) : isNotNull(column)
    case '$notNull':     return value === true ? isNotNull(column) : isNull(column)
    case '$between':     return Array.isArray(value) && value.length === 2
      ? between(column, value[0], value[1]) : undefined
    default:
      console.warn(`Unknown operator: ${operator}`)
      return undefined
  }
}

export function buildOrderBy(
  table: any,
  sorts: Array<{ field: string; order: 'asc' | 'desc' }>
): SQL[] {
  const tableColumns = getTableColumns(table)
  return sorts
    .map(({ field, order }) => {
      const column = tableColumns[field]
      if (!column) {
        console.warn(`Unknown sort field: ${field}`)
        return null
      }
      return order === 'asc' ? asc(column) : desc(column)
    })
    .filter(Boolean) as SQL[]
}
```

### 6. Request Parser (Query → Filters)

Converts Strapi-style query strings into filter objects:

```ts
export function parseFilters(query: Record<string, any>): Record<string, any> {
  const filters: Record<string, any> = {}

  for (const [key, value] of Object.entries(query)) {
    if (key.startsWith('filters[')) {
      const path = key
        .replace(/^filters/, '')
        .replace(/\[/g, '.')
        .replace(/\]/g, '')
        .split('.')
        .filter(Boolean)

      let current: any = filters
      for (let i = 0; i < path.length - 1; i++) {
        const segment = path[i]
        if (/^\d+$/.test(segment)) {
          const index = parseInt(segment)
          const parent = path[i - 1]
          if (!Array.isArray(current[parent])) current[parent] = []
          if (!current[parent][index]) current[parent][index] = {}
          current = current[parent][index]
        } else {
          if (!current[segment]) current[segment] = {}
          current = current[segment]
        }
      }

      const lastSegment = path[path.length - 1]
      current[lastSegment] = value
    }
  }
  return filters
}

export function parsePagination(query: Record<string, any>) {
  return {
    page: parseInt(query['pagination[page]'] || '1'),
    pageSize: parseInt(query['pagination[pageSize]'] || '25'),
  }
}

export function parseSort(query: Record<string, any>): Array<{ field: string; order: 'asc' | 'desc' }> {
  const sortParam = query.sort
  if (!sortParam) return []
  return sortParam.split(',').map((item: string) => ({
    order: item.startsWith('-') ? 'desc' : 'asc',
    field: item.replace(/^-/, ''),
  }))
}
```

## Common Pitfalls

| Pitfall | What happened | Fix |
|---|---|---|
| `(table as any)[field]` for column access | Raw property access, no type safety, fails silently on wrong field names | Use `getTableColumns(table)[field]` — Drizzle's official introspection API |
| `buildWhereClause` typed to `SQLiteTable` | Only accepts SQLite tables despite supporting PG/MySQL | Type as `any` or use a union of Drizzle table types |
| `as any` on every Drizzle query | Overuse of type assertions hides real type issues | Accept that `any` is the pragmatic choice for a multi-dialect wrapper |
| Double query for count | `find()` runs two queries (data + count) — fine for pagination, but no option to skip count | Add `options.includeCount` flag, default `true` |
| MySQL `RETURNING` workaround | MySQL doesn't support RETURNING, so create/update do a second SELECT | Document this performance characteristic |
| Manual query string parsing | String manipulation to strip `filters[` / `]` — fragile, breaks on edge cases | Use `qs` library: `qs.parse(url.split('?')[1])` |
| Manual Zod schemas for Drizzle tables | Hand-written Zod schemas duplicate table definitions | Use `drizzle-zod`: `createSelectSchema(table)`, `createInsertSchema(table)` |
| No abstract base for table repositories | Each repository re-implements CRUD or uses a factory with no custom methods | Use abstract `DrizzleRepository<T>` base class, extend per-table with domain methods |

## Lifecycle Hooks Pattern

Hooks operate at two layers:

```ts
hooks?: {
  repository?: {
    beforeCreate?: (data: any) => any | Promise<any>
    afterCreate?: (data: any) => void | Promise<void>
    beforeUpdate?: (id: any, data: any) => any | Promise<any>
    afterUpdate?: (data: any) => void | Promise<void>
  }
}
```

**Repository hooks** — data-level concerns (UUID generation, timestamps, sanitization)
**Controller hooks** — request-level concerns (auth enrichment, response transformation)

## Checklist: Building a New ORM Adapter

- [ ] Implement `Repository<T>` interface (find, findOne, create, update, delete)
- [ ] Handle dialect differences (RETURNING support, ID retrieval after insert)
- [ ] Use `getTableColumns(table)` for safe column access — NOT `(table as any)[field]`
- [ ] Build a query builder that maps `$eq`, `$gt`, `$in`, etc. to ORM queries
- [ ] Support `$and` / `$or` logical operators
- [ ] Support pagination with `LIMIT` / `OFFSET`
- [ ] Support sorting with `ASC` / `DESC`
- [ ] Count query re-applies the same WHERE clause for accurate totals
- [ ] Wire repository lifecycle hooks (beforeCreate, afterCreate)
- [ ] Create a factory function: `(schemaName) => Repository`
- [ ] Test with all three database dialects if applicable
- [ ] Use `qs` library for nested query string parsing — NOT manual string manipulation
- [ ] Auto-generate Zod schemas with `drizzle-zod` — NOT hand-written duplicates
- [ ] Consider abstract base class for table-specific repositories with custom methods

## File Structure for a New ORM Adapter

### Recommended (Domain-Driven)

```
src/
├── core/
│   └── repository.ts     # DrizzleRepository abstract base + IRepository interface
├── db/
│   ├── index.ts          # Database connection
│   └── schema.ts         # Drizzle table definitions
└── [entity]/
    └── [entity].repository.ts  # Entity repository extending DrizzleRepository
```

### Core-Only (Library)

```
packages/
  └─ [name]-[orm]/
      ├─ src/
      │   ├─ index.ts          # Re-exports
      │   ├─ factory.ts        # Repository factory function
      │   ├─ repository.ts     # Repository implementation
      │   └─ query-builder.ts  # Filter/sort → ORM query translation
      ├─ package.json          # peerDependencies: target-orm
      └─ tsconfig.json
```
