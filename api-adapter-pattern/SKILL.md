---
name: api-adapter-pattern
description: Use when building framework-agnostic APIs, creating framework adapters, or designing a unified request context layer that works across any web framework. Covers the RequestContext abstraction pattern.
---

# API Adapter Pattern

Build framework-agnostic API layers by abstracting the request/response surface into a unified `RequestContext` interface. Each framework gets a thin adapter that converts its native context into the shared shape.

## When to Use

- Building a library/toolkit that must support multiple web frameworks
- Wrapping existing CRUD logic to work with any framework
- Designing a plugin system where routes/controllers are framework-independent
- Migrating between frameworks incrementally

## The Pattern

### 1. Define the Unified Context Interface

```ts
export interface RequestContext {
  req: {
    method: string;
    path: string;
    query: Record<string, any>;
    params: Record<string, string>;
    headers: Record<string, string>;
    body?: any;
    json: () => Promise<any>;
    text: () => Promise<string>;
    formData?: () => Promise<FormData>;
  };
  res: {
    json: (data: any, status?: number) => Response;
    text: (data: string, status?: number) => Response;
    redirect: (url: string, status?: number) => Response;
    status: (code: number) => Response;
  };
  get: (key: string) => any;
  set: (key: string, value: any) => void;
  raw?: any;       // escape hatch to native request
  framework?: any; // escape hatch to native context
}
```

**Key design decisions:**
- `req.body` is `undefined` by default — body is lazily parsed via `json()`/`text()`/`formData()`
- `get`/`set` for middleware data sharing (like Hono's `c.set()`)
- `raw`/`framework` as escape hatches when you need native access

### 2. Create a Framework-Specific Adapter

Each framework gets a single adapter function. Here are three proven implementations:

#### Hono Adapter

```ts
import { Context } from 'hono'
import { ContentfulStatusCode, RedirectStatusCode, StatusCode } from 'hono/utils/http-status'

export function honoToRequestContextAdapter(c: Context): RequestContext {
  return {
    req: {
      method: c.req.method,
      path: c.req.path,
      query: c.req.query(),
      params: c.req.param(),
      headers: Object.fromEntries(c.req.raw.headers),
      body: undefined,
      json: () => c.req.json(),
      text: () => c.req.text(),
      formData: () => c.req.formData?.(),
    },
    res: {
      json: (data: any, status = 200) =>
        c.json(data, status as ContentfulStatusCode),
      text: (data: string, status = 200) =>
        c.text(data, status as ContentfulStatusCode),
      redirect: (url: string, status = 302) =>
        c.redirect(url, status as RedirectStatusCode),
      status: (code: number) => {
        c.status(code as StatusCode)
        return c.body(null)
      },
    },
    get: (key: string) => c.get(key),
    set: (key: string, value: any) => c.set(key, value),
    raw: c.req.raw,
    framework: c,
  }
}
```

#### Express Adapter

```ts
import { Request, Response } from 'express'

export interface ExpressAdapterOptions {
  useHttpContext?: boolean
  useMulter?: boolean
}

export function expressToRequestContextAdapter(
  req: Request,
  res: Response,
  options: ExpressAdapterOptions = {}
): RequestContext {
  let ctxStore: any = {}
  if (options.useHttpContext) {
    const httpContext = require('@sliit-foss/express-http-context')
    ctxStore = httpContext
  }

  return {
    req: {
      method: req.method,
      path: req.path,
      query: req.query,
      params: req.params,
      headers: req.headers as Record<string, string>,
      body: req.body,
      json: async () => req.body,
      text: async () => JSON.stringify(req.body),
      formData: async () => {
        if (req.file) return { ...req.file, fields: req.body } as any
        throw new Error('FormData not available')
      },
    },
    res: {
      json: (data: any, status = 200) => {
        res.status(status).json(data)
        return res as any
      },
      text: (data: string, status = 200) => {
        res.status(status).send(data)
        return res as any
      },
      redirect: (url: string, status = 302) => {
        res.redirect(status, url)
        return res as any
      },
      status: (code: number) => {
        res.status(code)
        return res as any
      },
    },
    get: (key: string) => ctxStore.get?.(key),
    set: (key: string, value: any) => ctxStore.set?.(key, value),
    raw: req,
    framework: { req, res },
  }
}
```

#### Fastify Adapter

```ts
import { FastifyRequest, FastifyReply } from 'fastify'

export interface FastifyAdapterOptions {
  useRequestContext?: boolean
  useMultipart?: boolean
}

export function fastifyRequestContextAdapter(
  request: FastifyRequest,
  reply: FastifyReply,
  options: FastifyAdapterOptions = {}
): RequestContext {
  return {
    req: {
      method: request.method,
      path: request.url,
      query: request.query as Record<string, any>,
      params: request.params as Record<string, string>,
      headers: request.headers as Record<string, string>,
      body: request.body,
      json: async () => request.body,
      text: async () => JSON.stringify(request.body),
      formData: options.useMultipart
        ? async () => (await request.file()) as any
        : undefined,
    },
    res: {
      json: (data: any, status = 200) => {
        reply.status(status).send(data)
        return reply.raw as any
      },
      text: (data: string, status = 200) => {
        reply.status(status).send(data)
        return reply.raw as any
      },
      redirect: (url: string, status = 302) => {
        reply.status(status).redirect(url)
        return reply.raw as any
      },
      status: (code: number) => {
        reply.status(code)
        return reply.raw as any
      },
    },
    get: (key: string) => (options.useRequestContext ? (request as any).get(key) : (request as any)[key]),
    set: (key: string, value: any) => {
      if (options.useRequestContext) (request as any).set(key, value)
      else (reply as any)[key] = value
    },
    raw: request,
    framework: { request, reply },
  }
}
```

### 3. Bridge Middleware

Convert framework-agnostic middleware to framework-specific middleware in the router:

```ts
// Hono middleware bridge
const honoMiddleware = middlewares.map((mw: MiddlewareHandler) => {
  return createMiddleware(async (c: Context, next) => {
    const ctx = honoToRequestContextAdapter(c)
    try {
      return await mw(ctx, async () => { await next() })
    } catch (error) {
      return handleControllerError(ctx, error)
    }
  })
})

// Express middleware bridge
const expressMiddlewares = middlewares.map((middleware: MiddlewareHandler) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ctx = expressToRequestContextAdapter(req, res)
      await middleware(ctx, async () => { /* no-op */ })
      if (!res.headersSent) next()
    } catch (error) {
      next(error)
    }
  }
})
```

### 4. Route Registration

Map abstract route specs → framework-specific route registration:

```ts
export interface RouteMapping {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  path: string
  handler: Function
  middlewares: MiddlewareHandler[]
}

// Hono: direct registration
app[method](path, ...honoMiddleware, honoHandler)

// Express: via Router
router[method](path, ...expressMiddlewares, expressHandler)

// Fastify: return route specs for manual registration
router.push({ method, url: fullPath, preHandler: preHandlers, handler: fastifyHandler })
```

## Permission & Multi-Tenant Context Pattern

Middleware progressively enriches the request context. Each middleware reads upstream data and adds downstream data:

```
jwt middleware → sets jwtPayload
  → tenant middleware → reads jwtPayload + x-tenant-id → sets tenantContext
    → permission middleware → reads roleId → sets permissions
      → route handler → reads all enriched context
```

### Typed Permission System

```ts
export enum PermissionAction {
  Find = "find",
  FindOne = "findOne",
  Create = "create",
  Update = "update",
  Delete = "delete",
}

export enum PermissionScope {
  Api = "api",
  Sys = "sys",
  User = "user",
}

export type PermissionString<TResource extends string> =
  `${PermissionScope}::${TResource}.${PermissionAction}`

export const createPermissionUtils = <TResource extends string>() => {
  type P = PermissionString<TResource>

  // Proxy-based enum-like utility — autocomplete in IDE
  const permission = new Proxy({} as Record<P, P>, {
    get: (_, key: string) => key as P,
  })

  // Check guard
  const check = (userPermissions: P[], required: P): boolean =>
    userPermissions.includes(required)

  // Assert guard — throws immediately
  const assert = (userPermissions: P[], required: P): void => {
    if (!check(userPermissions, required))
      throw new Error(`Unauthorized: missing permission "${required}"`)
  }

  return { permission, check, assert }
}

// Usage:
const perm = createPermissionUtils<"todos" | "users">()
const required = perm["api::todos.create"]  // ✅ type-safe, autocomplete

// In middleware:
const requirePermission = ({ permissions, match = "all" }: {
  permissions: PermissionString<any> | PermissionString<any>[]
  match?: "all" | "any"
}) => createMiddleware(async (ctx, next) => {
  const { permissions: userPermissions } = ctx.get("permission")
  const required = Array.isArray(permissions) ? permissions : [permissions]
  const hasPermission = match === "all"
    ? required.every(p => userPermissions.includes(p))
    : required.some(p => userPermissions.includes(p))

  if (!hasPermission) return ctx.res.json({ error: "Forbidden" }, 403)
  await next()
})
```

### Multi-Tenant Middleware Chain

```ts
// 1. JWT middleware — sets jwtPayload
app.use("*", jwt({ secret: process.env.JWT_SECRET! }))

// 2. Tenant middleware — validates membership, sets tenant context
const tenantMiddleware = createMiddleware(async (ctx, next) => {
  const db = ctx.get("db")
  const payload = ctx.get("jwtPayload")
  const tenantId = ctx.req.headers["x-tenant-id"]

  if (!tenantId) return ctx.res.json({ error: "X-Tenant-ID header required" }, 400)

  const membership = await db
    .select()
    .from(tenantMembership)
    .where(and(eq(membership.userId, payload.sub), eq(membership.tenantId, tenantId)))
    .limit(1)

  if (!membership) return ctx.res.json({ error: "Unauthorized" }, 403)

  ctx.set("tenant", {
    tenantId,
    userId: payload.sub,
    roleId: membership.roleId,
  })
  await next()
})

// 3. Permission middleware — populates role permissions
const permissionMiddleware = createMiddleware(async (ctx, next) => {
  const db = ctx.get("db")
  const { roleId } = ctx.get("tenant")

  const rolePermissions = await db
    .select()
    .from(rolePermission)
    .where(eq(rolePermission.roleId, roleId))

  ctx.set("permission", {
    permissions: rolePermissions.map(rp => rp.permissionKey),
  })
  await next()
})
```

**Key design decisions:**
- Middleware order matters — each downstream middleware depends on upstream context
- Use `ctx.get()` / `ctx.set()` from the RequestContext interface for cross-middleware data sharing
- Keep middleware focused on **single responsibility** — auth, tenant, permissions are separate layers

## Error Isolation Per Phase

Never let errors from one phase bleed into another. Each lifecycle phase gets its own try/catch:

```ts
app[spec.method](spec.path, async (c): Promise<Response> => {
  let validated = { params: undefined, query: undefined, body: undefined, headers: undefined }

  // Phase 1: Validation
  try {
    // parse body, headers, query, params → validate against schemas
  } catch (err) {
    console.error("Error during request validation on " + spec.path + ":", err)
    return c.json({ error: "Internal server error" }, 500)
  }

  // Phase 2: Before hook
  if (spec.hooks?.before) {
    try {
      validated = await spec.hooks.before(validated)
    } catch (err) {
      console.error("Error during before hook on " + spec.path + ":", err)
      return c.json({ error: "Internal server error" }, 500)
    }
  }

  // Phase 3: Handler execution
  let handlerResponse: { status: number; body: unknown }
  try {
    handlerResponse = await spec.handler({ ctx: c, data: validated })
  } catch (err) {
    console.error("Error during handler execution on " + spec.path + ":", err)
    return c.json({ error: "Internal server error" }, 500)
  }

  // Phase 4: After hook
  if (spec.hooks?.after) {
    try {
      handlerResponse.body = await spec.hooks.after(handlerResponse.body)
    } catch (err) {
      console.error("Error during after hook on " + spec.path + ":", err)
      return c.json({ error: "Internal server error" }, 500)
    }
  }

  // Phase 5: Response validation
  if (spec.validations?.response) {
    const schema = spec.validations.response[handlerResponse.status]
    if (!schema) {
      console.warn(`No response validation schema for status ${handlerResponse.status}`)
      return c.json({ error: "Internal server error" }, 500)
    }
    const result = schema.safeParse(handlerResponse.body)
    if (!result.success) {
      console.error(`Response validation failed on ${spec.path}:`, result.error.issues)
      return c.json({ error: "Internal server error" }, 500)
    }
    return c.json(result.data, handlerResponse.status)
  }

  return c.json(handlerResponse.body, handlerResponse.status)
})
```

**Why this matters:**
- A failing before-hook doesn't corrupt the handler response
- Response validation failures are caught and logged separately
- Each phase returns consistent error format
- Easy to add observability (timing, metrics) per phase

## Common Pitfalls

| Pitfall | What happened | Fix |
|---|---|---|
| `res` methods returning `Response` for Express | Express `res.json()` returns `Response` object, but the interface expects `Response` type | Cast with `as any` — Express doesn't use the return value |
| No `next()` continuation in Express middleware | The bridge wrapped `next()` as a no-op, losing the middleware chain | Call `next()` after middleware completes without sending a response |
| `status()` return type mismatch | Hono's `c.status()` + `c.body(null)` vs Express `res.status(code)` | Each adapter handles `status()` differently — don't assume the same return type |
| `formData` inconsistency | Different frameworks use different multipart libraries | Make `formData` optional in the interface, gate on adapter config flags |
| Monolithic middleware | One middleware does auth + tenant + permissions | Split into single-responsibility middlewares in a chain |
| No error phase isolation | Handler errors, validation errors, hook errors all caught in one block | Isolate try/catch per lifecycle phase |

## Structured Error Handling Pattern

All adapters should use a shared error response format:

```ts
export interface ErrorResponse {
  error: {
    message: string
    details?: any
    statusCode?: number
    fields?: Array<{
      field: string
      message: string
      code: string
    }>
    example?: any
  }
}

export const ERROR_CODES = {
  VALIDATION_FAILED: 'validation_failed',
  INVALID_JSON: 'invalid_json',
  DUPLICATE_ENTRY: 'duplicate_entry',
  INVALID_REFERENCE: 'invalid_reference',
  REQUIRED_FIELD: 'required_field',
  CONSTRAINT_VIOLATION: 'constraint_violation',
  NOT_FOUND: 'not_found',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  INTERNAL_ERROR: 'internal_server_error',
  DATABASE_ERROR: 'database_error',
} as const
```

### Cross-database constraint detection

```ts
function isUniqueConstraintError(error: any): boolean {
  return (
    error.code === '23505' ||           // PostgreSQL
    error.code === 'SQLITE_CONSTRAINT' || // SQLite
    error.errno === 1062 ||              // MySQL
    error.message?.includes('unique constraint')
  )
}

function isForeignKeyError(error: any): boolean {
  return (
    error.code === '23503' ||     // PostgreSQL
    error.errno === 1452 ||        // MySQL
    error.message?.includes('foreign key constraint')
  )
}
```

## Checklist: Building a New Framework Adapter

- [ ] Implement `[framework]ToRequestContextAdapter()` function
- [ ] Map `req.method`, `req.path`, `req.query`, `req.params`, `req.headers`
- [ ] Implement `req.json()` / `req.text()` / `req.formData()`
- [ ] Map `res.json()` / `res.text()` / `res.redirect()` / `res.status()`
- [ ] Wire `get()` / `set()` to framework's context storage
- [ ] Expose `raw` and `framework` escape hatches
- [ ] Bridge middleware: convert `MiddlewareHandler` → framework middleware
- [ ] Handle error responses via shared `ErrorResponse` format
- [ ] Test with a minimal CRUD endpoint (find, create, update, delete)

## File Structure for a New Adapter

### Recommended (Domain-Driven)

```
src/
├── core/
│   └── types.ts            # AppEnv, AppCtx, RouteContractSpec, defineHonoRouteContract
├── db/
│   ├── index.ts            # Database connection
│   └── schema.ts           # Drizzle table definitions
├── [entity]/
│   ├── [entity].schema.ts  # Zod schemas
│   ├── [entity].repository.ts
│   └── [entity].routes.ts  # Route contracts + registerHonoRoutes
└── app.ts                  # Hono app factory with DI middleware
```

### Core-Only (Library)

```
packages/
  └─ [name]-[framework]/
      ├─ src/
      │   ├─ index.ts          # Re-exports
      │   ├─ request.ts        # Context adapter function
      │   └─ router.ts         # Router + middleware bridge
      ├─ package.json          # peerDependencies: framework
      └─ tsconfig.json
```
