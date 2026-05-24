---
name: schema-factory-pattern
description: Use when building schema-driven CRUD APIs, Strapi-style resource generators, factory patterns for controllers/routes, or convention-based API scaffolding.
---

# Schema & Factory Pattern

Define resource schemas → generate fully typed CRUD controllers and routes automatically. A factory wires schemas, repositories, and controllers together through convention over configuration.

## When to Use

- Building a headless CMS or admin panel
- Generating CRUD APIs from data models
- Creating a convention-driven API toolkit
- Scaffolding REST resources with minimal boilerplate

## The Pattern

### 1. Schema Definition

A schema describes a resource's shape, table mapping, validation, and hooks:

```ts
export interface SchemaConfig<TTable = any> {
  kind: 'collectionType' | 'singleType'
  collectionName: string
  tableName: TTable
  info: {
    singularName: string
    pluralName: string
    displayName: string
    description?: string
  }
  options?: {
    timestamps?: boolean
    draftAndPublish?: boolean
  }
  hooks?: {
    repository?: {
      beforeCreate?: (data: any) => any | Promise<any>
      afterCreate?: (data: any) => void | Promise<void>
      beforeUpdate?: (id: any, data: any) => any | Promise<any>
      afterUpdate?: (data: any) => void | Promise<void>
    }
    controller?: {
      beforeCreate?: ControllerHook
      afterCreate?: ControllerHook
      beforeUpdate?: (ctx: RequestContext, id: any, data: any) => any | Promise<any>
      afterUpdate?: ControllerHook
    }
  }
  validation?: {
    request?: {
      create?: any  // Zod schema
      update?: any  // Zod schema
    }
  }
}

export interface SchemaDefinition<TTable = any> extends SchemaConfig<TTable> {
  _validated: true
}
```

### 2. Schema Registry

Map named schemas to definitions using Strapi-style naming:

```ts
export type SchemaRegistry = Record<string, SchemaDefinition>

export const schemas: SchemaRegistry = {
  'api::User.user': userSchema,
  'api::Product.product': productSchema,
} as const
```

**Naming convention:** `api::<singular>.<singular>` — the unique key used throughout the system.

### 3. Schema Helper

A helper that validates and normalizes schema config:

```ts
export function defineSchema<TTable = any>(
  config: SchemaConfig<TTable>
): SchemaDefinition<TTable> {
  if (!config.collectionName) throw new Error('collectionName is required')
  if (!config.tableName) throw new Error('tableName is required')
  if (!config.info.singularName || !config.info.pluralName)
    throw new Error('singularName and pluralName are required')
  if (!config.info.displayName) {
    config.info.displayName =
      config.info.singularName.charAt(0).toUpperCase() +
      config.info.singularName.slice(1)
  }

  return { ...config, _validated: true } as SchemaDefinition<TTable>
}
```

### 4. Factory

The factory binds a repository + schemas together and provides type-safe generators:

```ts
export function createFactory<S extends SchemaRegistry>(context: FactoryContext<S>) {
  return {
    createCoreController: <T extends keyof S>(
      schemaName: T,
      extensions?: (ctx: FactoryContext<S>) => Partial<CoreController>
    ) => createCoreController(context, schemaName as string, extensions),
    createCoreRoutes: <T extends keyof S>(
      schemaName: T,
      options?: CoreRouterOptions
    ) => createCoreRoutes(context, schemaName as string, options),
  }
}
```

### 5. Core Controller Generator

Generates CRUD handlers (`find`, `findOne`, `create`, `update`, `delete`) from a schema:

```ts
export function createCoreController<S extends SchemaRegistry>(
  context: FactoryContext<S>,
  schemaName: keyof S,
  extensions?: (ctx: FactoryContext<S>) => Partial<CoreController>
): CoreController {
  const { repository, schemas } = context
  const schema = schemas[schemaName]

  const coreController: CoreController = {
    async find(ctx) {
      const query = ctx.req.query
      const filters = parseFilters(query)
      const pagination = parsePagination(query)
      const sort = parseSort(query)

      const { data, total } = await repository(schemaName as string).find({
        filters, pagination, sort,
      })

      return ctx.res.json({
        data,
        meta: { pagination: createPaginationResponse(pagination.page, pagination.pageSize, total) },
      })
    },

    async findOne(ctx) {
      const id = ctx.req.params.id
      const data = await repository(schemaName as string).findOne(id)
      if (!data) return ctx.res.json({ error: 'Not found' }, 404)
      return ctx.res.json({ data })
    },

    async create(ctx) {
      const body = await ctx.req.json()
      if (!body.data) {
        return ctx.res.json(
          { error: { message: 'Invalid request format', details: 'Request body must contain a "data" field' } },
          400
        )
      }

      let data = body.data
      const requestSchema = schema?.validation?.request?.create
      if (requestSchema) {
        const result = requestSchema.safeParse(data)
        if (!result.success) return ctx.res.json(createValidationErrorResponse(result.error), 400)
        data = result.data
      }

      if (schema.hooks?.controller?.beforeCreate) {
        data = await schema.hooks.controller.beforeCreate(ctx, data)
      }

      const result = await repository(schemaName as string).create(data)

      if (schema?.hooks?.controller?.afterCreate) {
        const hookResult = await schema.hooks.controller.afterCreate(ctx, result)
        if (isResponse(hookResult)) {
          throw new Error('Controller hooks must return data, not Response objects.')
        }
        if (hookResult !== undefined) result = hookResult
      }

      return ctx.res.json({ data: result }, 201)
    },

    async update(ctx) {
      const id = ctx.req.params.id
      const body = await ctx.req.json()
      if (!body.data) {
        return ctx.res.json(
          { error: { message: 'Invalid request format', details: 'Request body must contain a "data" field' } },
          400
        )
      }

      let data = body.data
      const requestSchema = schema?.validation?.request?.update
      if (requestSchema) {
        const result = requestSchema.safeParse(data)
        if (!result.success) return ctx.res.json(createValidationErrorResponse(result.error), 400)
        data = result.data
      }

      if (schema?.hooks?.controller?.beforeUpdate) {
        const hookResult = await schema.hooks.controller.beforeUpdate(ctx, id, data)
        if (hookResult !== undefined) data = hookResult
      }

      let result = await repository(schemaName as string).update(id, data)
      if (!result) return handleNotFoundError(ctx, id)

      if (schema?.hooks?.controller?.afterUpdate) {
        const hookResult = await schema.hooks.controller.afterUpdate(ctx, result)
        if (isResponse(hookResult)) {
          throw new Error('Controller hooks must return data, not Response objects.')
        }
        if (hookResult !== undefined) result = hookResult
      }

      return ctx.res.json({ data: result })
    },

    async delete(ctx) {
      const id = ctx.req.params.id
      const data = await repository(schemaName as string).delete(id)
      if (!data) return handleNotFoundError(ctx, id)
      return ctx.res.json({ data })
    },
  }

  if (extensions) return { ...coreController, ...extensions(context) }
  return coreController
}

function isResponse(value: any): boolean {
  return value && typeof value === 'object' && (
    value instanceof Response ||
    value.constructor?.name === 'Response' ||
    (value.status !== undefined && value.headers !== undefined)
  )
}
```

### 6. Route Generator

Generates route specs from a schema:

```ts
export function createCoreRoutes<S extends SchemaRegistry>(
  context: FactoryContext<S>,
  schemaName: keyof S,
  options: CoreRouterOptions = {}
): RouteDefinition {
  const schema = context.schemas[schemaName]
  const basePath = options.prefix ?? `/${schema.info.pluralName}`

  const coreRoutes = ['find', 'findOne', 'create', 'update', 'delete'] as const
  let routesToInclude = [...coreRoutes]

  if (options.only) routesToInclude = routesToInclude.filter(r => options.only?.includes(r))
  if (options.except) routesToInclude = routesToInclude.filter(r => !options.except?.includes(r))

  const routes: RouteSpec[] = []
  routesToInclude.forEach(routeName => {
    const config = options.config?.[routeName]
    switch (routeName) {
      case 'find':
        routes.push({ method: 'GET', path: basePath, handler: `${schemaName}.find`, config })
        break
      case 'findOne':
        routes.push({ method: 'GET', path: `${basePath}/:id`, handler: `${schemaName}.findOne`, config })
        break
      case 'create':
        routes.push({ method: 'POST', path: basePath, handler: `${schemaName}.create`, config })
        break
      case 'update':
        routes.push({ method: 'PUT', path: `${basePath}/:id`, handler: `${schemaName}.update`, config })
        break
      case 'delete':
        routes.push({ method: 'DELETE', path: `${basePath}/:id`, handler: `${schemaName}.delete`, config })
        break
    }
  })

  return { routes }
}
```

### 7. Router Mappings (Framework-Agnostic)

Maps route specs + controllers → framework-agnostic route mappings:

```ts
export function createRouterMappings(
  routeDefinitions: RouteDefinition[],
  controllers: ControllerRegistry
): RouteMapping[] {
  const mappings: RouteMapping[] = []

  routeDefinitions.forEach(({ routes }) => {
    routes.forEach(route => {
      const config = route.config
      const middlewareStack: MiddlewareHandler[] = []

      if (config?.auth !== false) {
        const authMiddleware = middlewares.get('auth')
        if (authMiddleware) middlewareStack.push(authMiddleware)
      }

      if (config?.middlewares?.length) {
        config.middlewares.forEach(mwConfig => {
          if (typeof mwConfig === 'string') {
            const mw = middlewares.get(mwConfig)
            if (mw) middlewareStack.push(mw)
          } else if (typeof mwConfig === 'function') {
            middlewareStack.push(mwConfig)
          }
        })
      }

      // Parse handler: "api::user.user.find" → controllerKey + actionName
      const parts = route.handler.split('.')
      let controllerKey: string, actionName: string

      if (parts.length === 3) {
        controllerKey = `${parts[0]}.${parts[1]}`
        actionName = parts[2]
      } else if (parts.length === 2) {
        controllerKey = parts[0]
        actionName = parts[1]
      } else {
        console.warn(`Invalid handler format: ${route.handler}`)
        return
      }

      const controller = controllers[controllerKey]
      if (!controller) {
        console.warn(`Controller not found: ${controllerKey}`)
        return
      }

      const handler = controller[actionName]
      if (!handler) {
        console.warn(`Handler not found: ${controllerKey}.${actionName}`)
        return
      }

      mappings.push({
        method: route.method.toLowerCase() as any,
        path: route.path,
        handler,
        middlewares: middlewareStack,
      })
    })
  })

  return mappings
}
```

### 8. Resource Registry

High-level helper that ties everything together:

```ts
export function createResource<S extends SchemaRegistry>(
  factories: ReturnType<typeof createFactory<S>>,
  schemaName: keyof S,
  options?: {
    controllerExtensions?: (ctx: FactoryContext<S>) => ControllerExtensionsDefinition
    routeOptions?: CoreRouterOptions
    customRoutes?: RouteSpec[]
  }
): {
  controllerRegistry: ControllerRegistry
  routeDefinitions: RouteDefinition[]
} {
  const controller = factories.createCoreController(schemaName, options?.controllerExtensions)
  const coreRoutes = factories.createCoreRoutes(schemaName, options?.routeOptions)

  const routes: RouteDefinition[] = []
  if (options?.customRoutes) routes.push(createCustomRoutes(options.customRoutes))
  routes.push(coreRoutes)

  return {
    controllerRegistry: { [schemaName]: controller as CoreController },
    routeDefinitions: routes,
  }
}

export function createResourceRegistry<S extends SchemaRegistry>(
  factories: ReturnType<typeof createFactory<S>>,
  resources: Array<{
    schemaName: keyof S
    controllerExtensions?: (ctx: FactoryContext<S>) => ControllerExtensionsDefinition
    routeOptions?: CoreRouterOptions
    customRoutes?: RouteSpec[]
  }>
) {
  const controllers: Record<string, CoreController> = {}
  const allRoutes: RouteDefinition[] = []

  for (const resource of resources) {
    const { controllerRegistry, routeDefinitions } = createResource(factories, resource.schemaName, resource)
    controllers[resource.schemaName as string] = controllerRegistry[resource.schemaName as string]
    allRoutes.push(...routeDefinitions)
  }

  return { controllers, routes: allRoutes }
}
```

## Route Contract Pattern (Recommended)

Instead of handlers calling `ctx.res.json()` directly, each route is a **self-contained contract spec** that's framework-agnostic. The adapter handles validation, hooks, and response serialization.

### Core Types

```ts
// Request validation schema (Zod)
export type TSchemaDefinition = {
  params?: z.ZodType
  query?: z.ZodType
  body?: z.ZodType
  headers?: z.ZodType
}

// Inferred request shape from Zod schemas
export type TInferredRequestShape<TSchema extends TSchemaDefinition> = {
  params: TSchema['params'] extends z.ZodType ? z.infer<TSchema['params']> : undefined
  query: TSchema['query'] extends z.ZodType ? z.infer<TSchema['query']> : undefined
  body: TSchema['body'] extends z.ZodType ? z.infer<TSchema['body']> : undefined
  headers: TSchema['headers'] extends z.ZodType ? z.infer<TSchema['headers']> : undefined
}

// Handler receives typed data + framework context
export type RouteHandler<TContext, TSchema extends TSchemaDefinition> = (
  input: { ctx: TContext; data: TInferredRequestShape<TSchema> }
) => Promise<{ status: number; body: unknown }> | { status: number; body: unknown }

// Full route contract spec
export type RouteContractSpec<TSchema extends TSchemaDefinition, TContext> = {
  method: 'get' | 'post' | 'put' | 'delete' | 'patch'
  path: string
  summary?: string
  validations?: {
    request?: TSchema                      // ← uses the generic, NOT TSchemaDefinition
    response?: Record<number, z.ZodType>   // per-status response validation
  }
  hooks?: {
    before?: (data: TInferredRequestShape<TSchema>) => typeof data | Promise<typeof data>
    after?: (body: unknown) => unknown | Promise<unknown>
  }
  handler: RouteHandler<TContext, TSchema>
}

/**
 * Input type for the defineRouteContract factory.
 * Allows the factory to infer TSchema from the literal object
 * without requiring explicit generic binding at call sites.
 */
export type RouteContractSpecInput<TSchema extends TSchemaDefinition, TContext> =
  Omit<RouteContractSpec<TSchema, TContext>, 'validations'> & {
    validations?: {
      request?: TSchema
      response?: Record<number, z.ZodType>
    }
  }

// Factory function for type narrowing
export const defineRouteContract = <
  TConfig extends { Context?: unknown } = { Context: unknown },
  TSchema extends TSchemaDefinition = TSchemaDefinition,
>(
  spec: RouteContractSpecInput<TSchema, TConfig['Context']>
): RouteContractSpec<TSchema, TConfig['Context']> => spec
```

### Framework-Specific Adapter

Each framework gets a typed factory and a register function:

```ts
export const defineHonoRouteContract = <TSchema extends TSchemaDefinition>(
  spec: RouteContractSpecInput<TSchema, AppContext>
) => defineRouteContract<{ Context: AppContext }, TSchema>(spec)

export const registerHonoRoute = (
  app: Hono,
  spec: RouteContractSpec<any, AppContext>,
) => {
  app[spec.method](spec.path, async (c): Promise<Response> => {
    let validated = { params: undefined, query: undefined, body: undefined, headers: undefined }

    // 1. Validate request
    try {
      let rawBody: unknown = undefined
      if (spec.validations?.request?.body) {
        try { rawBody = await c.req.json() }
        catch { return c.json({ error: 'Invalid JSON body' }, 400) }
      }

      // Header normalization (lowercase)
      let headersInput: Record<string, unknown> | undefined = undefined
      if (spec.validations?.request?.headers instanceof z.ZodObject) {
        const schemaShape = spec.validations.request.headers.shape
        headersInput = {}
        for (const schemaKey of Object.keys(schemaShape)) {
          headersInput[schemaKey] = c.req.header()[schemaKey.toLowerCase()]
        }
      }

      const results = {
        params: spec.validations?.request?.params?.safeParse(c.req.param()),
        query: spec.validations?.request?.query?.safeParse(parseQueryString(c.req.raw.url)),
        body: spec.validations?.request?.body?.safeParse(rawBody),
        headers: spec.validations?.request?.headers?.safeParse(headersInput),
      }

      const errors = Object.fromEntries(
        Object.entries(results)
          .filter(([_, r]) => r && !r.success)
          .map(([key, r]) => [key, (r as z.SafeParseError<any>).error.issues])
      )

      if (Object.keys(errors).length > 0) {
        return c.json({ error: 'Request validation failed', details: errors }, 400)
      }

      validated = {
        params: results.params?.success ? results.params.data : undefined,
        query: results.query?.success ? results.query.data : undefined,
        body: results.body?.success ? results.body.data : undefined,
        headers: results.headers?.success ? results.headers.data : undefined,
      }
    } catch {
      return c.json({ error: 'Internal server error' }, 500)
    }

    // 2. Before hook
    if (spec.hooks?.before) validated = await spec.hooks.before(validated)

    // 3. Handler
    let response: { status: number; body: unknown }
    try {
      response = await spec.handler({ ctx: c as AppContext, data: validated })
    } catch {
      return c.json({ error: 'Internal server error' }, 500)
    }

    // 4. After hook
    if (spec.hooks?.after) response.body = await spec.hooks.after(response.body)

    // 5. Response validation (per status code)
    if (spec.validations?.response) {
      const schema = spec.validations.response[response.status]
      if (!schema) {
        console.warn(`No response validation schema for status ${response.status} on ${spec.path}`)
        return c.json({ error: 'Internal server error' }, 500)
      }
      const result = schema.safeParse(response.body)
      if (!result.success) {
        console.error(`Response validation failed on ${spec.path}:`, result.error.issues)
        return c.json({ error: 'Internal server error' }, 500)
      }
      return c.json(result.data, response.status)
    }

    return c.json(response.body, response.status)
  })
}
```

### Real-World Usage

```ts
// Define Zod schemas — DO NOT annotate with : TSchemaDefinition (widens type, breaks inference)
const FindOptionsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
})

const ListTenantsSchema = { query: FindOptionsSchema }
//  ↑ no type annotation — preserves literal type for TInferredRequestShape inference

export const ListTenantsContract = defineHonoRouteContract({
  method: 'get',
  path: '/',
  validations: {
    request: ListTenantsSchema,
    response: { 200: createPaginatedResponseSchema(TenantTable) },
  },
  handler: async ({ ctx, data }) => {
    // data.query is correctly inferred as { page: number; pageSize: number }
    // data.params is undefined (not defined in ListTenantsSchema)
    const db = ctx.get('db')
    const tenantRepo = new TenantRepository(db)
    const result = await tenantRepo.find(data.query)
    return { status: 200, body: result }
  },
})

const GetTenantSchema = { params: z.object({ id: z.string() }) }
//  ↑ no annotation

export const GetTenantContract = defineHonoRouteContract({
  method: 'get',
  path: '/:id',
  validations: {
    request: GetTenantSchema,
    response: { 200: TenantRowSchema, 404: ErrorSchema },
  },
  handler: async ({ ctx, data }) => {
    const db = ctx.get('db')
    const tenantRepo = new TenantRepository(db)
    const tenant = await tenantRepo.findOne(data.params?.id)  // ?. guard for safety
    if (!tenant) return { status: 404, body: { error: 'Not found' } }
    return { status: 200, body: tenant }
  },
})

// Register all contracts
const tenantRoutes = new Hono()
registerHonoRoutes(tenantRoutes, [
  ListTenantsContract,
  GetTenantContract,
  CreateTenantContract,
  UpdateTenantContract,
  DeleteTenantContract,
])
app.route('/tenants', tenantRoutes)
```

### Type Inference Gotchas

```ts
// ❌ BAD — annotation widens type, TInferredRequestShape sees z.ZodType | undefined
const MySchema: TSchemaDefinition = { query: FindOptionsSchema }
// typeof MySchema.query = z.ZodType (not the concrete schema)

// ✅ GOOD — no annotation, literal type preserved
const MySchema = { query: FindOptionsSchema }
// typeof MySchema.query = ZodObject<{ page: ZodDefault<...>, ... }>
```

The `: TSchemaDefinition` annotation causes TypeScript to forget the concrete schema shape. Without it, `TInferredRequestShape<typeof MySchema>` correctly resolves `data.query` to the inferred Zod type instead of falling back to `undefined`.

### Handler Pattern Comparison

| Aspect | Schema Factory Controllers | Route Contracts |
|---|---|---|
| Handler return | `ctx.res.json(data, 201)` | `{ status: 201, body: data }` |
| Framework coupling | High (knows `ctx.res`) | None (pure function) |
| Response validation | None | Per-status Zod schemas |
| Error handling | Per-controller try/catch | Centralized in adapter |
| Testing | Mock `RequestContext` | Pure input/output |
| OpenAPI generation | Hard — response shapes implicit | Easy — response schemas explicit |

**Route Contracts are recommended for new projects.** The Schema Factory controller pattern is still valid when migrating existing code or when maximum flexibility is needed.

## IUseCase / Domain Layer

Add a Use Case layer between handlers and repositories for complex business logic:

```ts
export interface IUseCase<Output = void, Input = void> {
  execute(input: Input): Promise<Output>
}

export class AssignUserToTenant implements IUseCase<{ success: boolean }, {
  userId: string; tenantId: string; roleId: string
}> {
  constructor(
    private tenantRepo: ITenantRepository,
    private membershipRepo: IMembershipRepository,
    private userRepo: IUserRepository,
  ) {}

  async execute(input: { userId: string; tenantId: string; roleId: string }) {
    const tenant = await this.tenantRepo.findOne(input.tenantId)
    if (!tenant) throw new Error('Tenant not found')

    const user = await this.userRepo.findOne(input.userId)
    if (!user) throw new Error('User not found')

    const existing = await this.membershipRepo.find({
      filters: { userId: input.userId, tenantId: input.tenantId },
    })
    if (existing.data.length > 0) throw new Error('Already a member')

    await this.membershipRepo.create({
      userId: input.userId,
      tenantId: input.tenantId,
      roleId: input.roleId,
    })

    return { success: true }
  }
}

// Usage in Route Contract:
export const AssignRoleContract = defineHonoRouteContract({
  method: 'post',
  path: '/:id/roles',
  validations: {
    request: {
      params: z.object({ id: z.string() }),
      body: z.object({ userId: z.string(), roleId: z.string() }),
    },
    response: { 200: z.object({ success: z.boolean() }) },
  },
  handler: async ({ ctx, data }) => {
    const db = ctx.get('db')
    const useCase = new AssignUserToTenant(
      new TenantRepository(db),
      new MembershipRepository(db),
      new UserRepository(db),
    )
    const result = await useCase.execute({
      userId: data.body.userId,
      tenantId: data.params.id,
      roleId: data.body.roleId,
    })
    return { status: 200, body: result }
  },
})
```

**When to add a Use Case layer:**
- Operation spans multiple repositories
- Complex validation logic beyond Zod (e.g., business rules)
- Need to enforce single responsibility — handler only orchestrates
- Reusable across multiple routes or events

**When to skip it:**
- Simple CRUD — route contract handler calls repository directly
- No cross-entity logic
- Team is small, project is simple

## Usage Flow

```
Route Contract Flow (Recommended):
1. Define schemas      → const MySchema = { query: FindOptionsSchema }  (no : TSchemaDefinition!)
2. Define contracts    → defineHonoRouteContract({ method, path, validations, handler })
3. Register routes     → registerHonoRoutes(app, [contract1, contract2])
4. Adapter handles     → validate → before hook → handler → after hook → validate response → respond

Schema Factory Flow:
1. Define schemas      → defineSchema({ ... })
2. Create registry     → { 'api::User.user': userSchema }
3. Create factory      → createFactory({ repository, schemas })
4. Generate resources  → createResourceRegistry(factories, [{ schemaName: '...' }])
5. Create router       → frameworkAdapter.createRouter(routes, controllers)
6. Mount               → app.route('/api', router)
```

## Common Pitfalls

| Pitfall | What happened | Fix |
|---|---|---|
| `schemaName as string` casts | Factory uses `keyof S` generics but internals cast to `string` | Accept the trade-off: generics give IDE autocomplete, string keys at runtime |
| `console.warn` for missing controllers | Silent failures in production | Consider throwing in development, or returning a 500 response |
| Controller hooks returning `Response` | Users accidentally return `ctx.res.json()` from hooks | The `isResponse()` guard catches this — keep it |
| No relations support | Schemas are flat — no populate/join capability | Plan for `$populate` filter operator |
| `body.data` envelope required | All create/update requests must be `{ data: { ... } }` | Document clearly; consider supporting flat bodies as convenience |
| Framework-coupled handlers | Handlers call `ctx.res.json()` — can't test without mocking | Use Route Contract pattern: handler returns `{ status, body }` |
| No response validation | Handlers can return any shape — bugs slip through | Add per-status response Zod schemas in route contracts |
| Monolithic error handling | All errors caught in one block | Isolate try/catch per lifecycle phase |
| No domain layer | Controllers call repositories directly — complex logic leaks into handlers | Add `IUseCase` layer for cross-repository business logic |
| Manual request parsing | String manipulation to parse `filters[name][$eq]=value` | Use `qs` library + Zod schema validation |

## Type Safety Through Generics

The key type pattern — `S extends SchemaRegistry` — flows type information through the entire stack:

```ts
const factories = createFactory({ repository, schemas })

// 'api::User.user' is suggested by IDE, not just 'string'
const userController = factories.createCoreController('api::User.user')

const { routes, controllers } = createResourceRegistry(factories, [
  { schemaName: 'api::User.user' },  // ✅ autocomplete works
])
```

## Checklist: Building a Schema-Driven API Generator

### Route Contract Approach (Recommended)
- [ ] Define `RouteContractSpec` type with method, path, validations, hooks, handler
- [ ] Create `defineRouteContract()` factory for type narrowing
- [ ] Build framework-specific `defineHonoRouteContract()` (or Express/Fastify equivalent)
- [ ] Implement `registerHonoRoute()` — full lifecycle: validate → hook → handler → validate response
- [ ] Handle JSON body parsing with 400 on invalid JSON
- [ ] Normalize headers (Hono lowercases, schemas may not)
- [ ] Use `qs` library for nested query string parsing
- [ ] Support per-status response validation schemas
- [ ] Isolate try/catch per lifecycle phase
- [ ] Build `registerHonoRoutes()` for bulk registration
- [ ] Add `before`/`after` hooks at the route contract level

### Schema Factory Approach
- [ ] Define `SchemaConfig` with all required fields
- [ ] Implement `defineSchema()` validation helper
- [ ] Create `SchemaRegistry` type for named schemas
- [ ] Build `createFactory()` that binds repository + schemas
- [ ] Implement `createCoreController()` with all 5 CRUD methods
- [ ] Add Zod validation in create/update controllers
- [ ] Wire controller hooks (before/after for create/update)
- [ ] Build `createCoreRoutes()` with only/except/config options
- [ ] Implement `createRouterMappings()` for framework-agnostic mapping
- [ ] Handle handler string parsing (`api::user.user.find` → controller + action)
- [ ] Build `createResourceRegistry()` for multi-resource scaffolding
- [ ] Support custom controller extensions + custom routes
- [ ] Use generics throughout for IDE autocomplete

### Domain Layer (Optional)
- [ ] Define `IUseCase<Output, Input>` interface
- [ ] Create use cases for cross-repository operations
- [ ] Inject repositories via constructor
- [ ] Call use cases from route contract handlers

## File Structure for a Schema-Driven API System

### Recommended (Domain-Driven)

```
src/
├── core/
│   ├── types.ts            # RouteContractSpec, defineRouteContract, registerHonoRoute
│   └── repository.ts       # DrizzleRepository abstract base class
├── db/
│   ├── index.ts            # Database connection
│   └── schema.ts           # Drizzle table definitions
├── [entity]/
│   ├── [entity].schema.ts  # Zod schemas (drizzle-zod generated + request schemas)
│   ├── [entity].repository.ts  # Entity-specific repository extending DrizzleRepository
│   └── [entity].routes.ts  # Route contracts + route registration
└── app.ts                  # Hono app factory with DI middleware
```

### Core-Only (Library)

```
core/
├── src/
│   ├─ index.ts           # Re-exports
│   ├─ types.ts           # Core interfaces (RouteContractSpec, TSchemaDefinition)
│   ├─ schema.ts          # defineSchema() helper
│   ├─ factory.ts         # createFactory()
│   ├─ controller.ts      # createCoreController()
│   ├─ route.ts           # createCoreRoutes(), createCustomRoutes()
│   ├─ router.ts          # createRouterMappings()
│   ├─ registry.ts        # createResource(), createResourceRegistry()
│   ├─ request-parser.ts  # parseFilters(), parsePagination(), parseSort()
│   ├─ controller-helper.ts # error handlers, validation
│   ├─ utils.ts           # response builders, pagination helpers
│   └─ error-codes.ts     # Standardized error codes
```
