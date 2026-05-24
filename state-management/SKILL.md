---
name: state-management
description: Designs and implements state management architecture for both frontend (global client state, server cache, URL state) and backend (Redis caching, session management, distributed locks). Use when a user needs to share data across components without prop drilling, cache expensive API responses, sync state to the URL, manage Redis, or prevent race conditions in concurrent server operations. Trigger when user mentions "global state", "Zustand", "Redux", "React Query", "caching", "Redis", "session", "why does my data disappear on page refresh", or "how do I share state across pages".
---

# State Management

## Purpose
State management is where vibe-coded apps most commonly fall apart. The pattern failure is always the same: a developer uses `useState` for data that should be global, or calls the same API in 10 different components, or loses data on page navigation. This skill defines where each type of state should live and the right tool for each job.

## State Classification (Choose Before Writing Code)

The first step is always to classify the state. The wrong classification leads to the wrong tool:

| State Type | Definition | Right Tool |
|---|---|---|
| **Server state** | Data from an API that can be stale and needs refresh | React Query (`@tanstack/react-query`) |
| **Global client state** | UI state shared across multiple unrelated components (user session, cart, modal open/close, theme) | Zustand |
| **Local component state** | State that belongs to exactly one component (input value, toggle) | `useState` |
| **URL/route state** | Filters, pagination, tabs - state that should survive a page refresh and be shareable via link | `nuqs` for Next.js |
| **Form state** | Field values, validation errors, submission state | `react-hook-form` (see `frontend` skill) |
| **Server cache** | Expensive computed data on the backend that doesn't need fresh DB reads on every request | Redis (backend) |

## Progressive Disclosure
- Load `references/react-query.md` for advanced React Query patterns (optimistic updates, infinite scroll, prefetching).
- Load `references/redis-patterns.md` for cache invalidation strategies, TTL design, and distributed lock patterns.

---

## SOP: Frontend State Management

### Step 1 - Server State with React Query
React Query is the right tool for any data that lives on the server. It handles loading states, error states, background refresh, and deduplication so you don't have to.

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

**Setup in `app/providers.tsx`:**
```tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } // 1 min stale, 1 retry
  }));
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

Wrap `app/layout.tsx` with `<Providers>`.

**Define queries with typed hooks:**
```tsx
// hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const PRODUCTS_KEY = ["products"] as const;

export function useProducts() {
  return useQuery({
    queryKey: PRODUCTS_KEY,
    queryFn: async () => {
      const res = await fetch("/api/v1/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      return res.json() as Promise<{ data: Product[] }>;
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productIn: ProductCreate) =>
      fetch("/api/v1/products", { method: "POST", body: JSON.stringify(productIn) }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_KEY }); // auto-refetch list after create
    },
  });
}
```

**In the component:**
```tsx
"use client";
function ProductList() {
  const { data, isLoading, isError } = useProducts();
  const createProduct = useCreateProduct();

  if (isLoading) return <Skeleton />;
  if (isError) return <ErrorState />;
  return (
    <>
      {data?.data.map(p => <ProductCard key={p.id} product={p} />)}
      <button onClick={() => createProduct.mutate({ name: "New", price: 9.99 })}>Add</button>
    </>
  );
}
```

**Key rule:** Never `fetch()` inside a `useEffect` when React Query can do it. `useEffect`-based fetching gives you no loading state, no error handling, no deduplication, and no cache.

### Step 2 - Global Client State with Zustand
Use Zustand when state belongs to the UI (not the server) and needs to be shared across more than one component.

```bash
npm install zustand
```

**Define a store:**
```ts
// stores/useCartStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware"; // persist to localStorage

interface CartItem { productId: string; name: string; price: number; quantity: number; }

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => set((state) => {
        const existing = state.items.find(i => i.productId === item.productId);
        if (existing) {
          return { items: state.items.map(i => i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i) };
        }
        return { items: [...state.items, { ...item, quantity: 1 }] };
      }),
      removeItem: (productId) => set((state) => ({ items: state.items.filter(i => i.productId !== productId) })),
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "cart-storage" } // localStorage key
  )
);
```

**In any component (no Provider needed):**
```tsx
function CartButton() {
  const { items, total } = useCartStore();
  return <button>Cart ({items.length}) - ${total().toFixed(2)}</button>;
}
```

**When to use Zustand vs React Query:**
- User clicks "Add to Cart" -> local UI action -> **Zustand**
- "Show the product details from the API" -> server data -> **React Query**
- "Is the sidebar open?" -> UI-only state -> **Zustand**
- "Is the user authenticated and what are their permissions?" -> comes from your API -> **React Query** (or a dedicated auth store backed by React Query)

### Step 3 - URL State with nuqs (Next.js)
Use for any filter, sort, pagination, or tab that a user should be able to bookmark or share:

```bash
npm install nuqs
```

```tsx
// app/products/page.tsx
import { createSearchParamsCache, parseAsString, parseAsInteger } from "nuqs/server";
import { ProductFilters } from "./ProductFilters";

const searchParamsCache = createSearchParamsCache({
  category: parseAsString.withDefault("all"),
  page: parseAsInteger.withDefault(1),
});

export default async function ProductsPage({ searchParams }: { searchParams: Record<string, string> }) {
  const { category, page } = searchParamsCache.parse(searchParams);
  const products = await fetchProducts({ category, page }); // server-side, type-safe
  return (
    <>
      <ProductFilters />  {/* client component - updates URL */}
      <ProductList products={products} />
    </>
  );
}
```

```tsx
// components/ProductFilters.tsx
"use client";
import { useQueryState } from "nuqs";

export function ProductFilters() {
  const [category, setCategory] = useQueryState("category", { defaultValue: "all" });
  return <Select value={category} onValueChange={setCategory}> ... </Select>;
}
```

The URL becomes `/products?category=electronics&page=2`. Bookmarkable, shareable, refresh-safe.

---

## SOP: Backend State Management (Redis)

### Step 4 - Redis Cache-Aside Pattern
The cache-aside (lazy-loading) pattern: check cache first, miss -> fetch DB -> write to cache -> return.

```python
# services/product_service.py
import json
from redis.asyncio import Redis

async def get_product_cached(product_id: UUID, db: AsyncSession, redis: Redis) -> ProductOut:
    cache_key = f"product:{product_id}"
    
    # L1: Check cache
    cached = await redis.get(cache_key)
    if cached:
        return ProductOut.model_validate_json(cached)
    
    # L2: Cache miss - hit DB
    product = await product_repo.get_by_id(db, product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    
    result = ProductOut.model_validate(product)
    
    # Write to cache with TTL
    await redis.setex(cache_key, 300, result.model_dump_json())  # 5 minute TTL
    return result

async def update_product_and_invalidate(product_id: UUID, ..., redis: Redis):
    # After mutation, always invalidate
    updated = await product_repo.update(db, product_id, ...)
    await redis.delete(f"product:{product_id}")     # invalidate single item
    await redis.delete("products:list")              # invalidate list cache too
    return updated
```

**TTL Design Guide:**
| Data Type | TTL | Reason |
|---|---|---|
| User profile | 10 min | Changes infrequently, personal data |
| Product catalog | 5 min | Changes via admin only |
| Aggregated stats/counts | 1 min | Acceptable staleness for dashboards |
| Auth tokens | Match JWT expiry | Must not outlast the token |
| Session data | 24h-7d | Match session lifetime |

### Step 5 - Redis Dependency Injection (FastAPI)
```python
# database.py (add Redis)
from redis.asyncio import Redis, ConnectionPool

redis_pool = ConnectionPool.from_url(settings.REDIS_URL, max_connections=20)

async def get_redis() -> Redis:
    return Redis(connection_pool=redis_pool)

# In route:
@router.get("/{product_id}")
async def get_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis),
):
    return SuccessResponse(data=await product_service.get_product_cached(product_id, db, redis))
```

### Step 6 - Distributed Lock (Prevent Race Conditions)
Use when multiple workers might process the same job concurrently (e.g., double-processing a webhook):

```python
# utils/redis_lock.py
import asyncio
from redis.asyncio import Redis

class RedisLock:
    def __init__(self, redis: Redis, key: str, ttl_seconds: int = 30):
        self.redis = redis
        self.key = f"lock:{key}"
        self.ttl = ttl_seconds

    async def __aenter__(self):
        acquired = await self.redis.set(self.key, "1", nx=True, ex=self.ttl)
        if not acquired:
            raise HTTPException(409, "Resource is locked by another process")
        return self

    async def __aexit__(self, *args):
        await self.redis.delete(self.key)

# Usage in webhook handler:
async def process_payment_webhook(payment_id: str, redis: Redis):
    async with RedisLock(redis, f"webhook:{payment_id}", ttl_seconds=60):
        # Only one worker processes this webhook event
        await payment_service.process(payment_id)
```
