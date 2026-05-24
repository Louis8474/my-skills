---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality. Use this skill when the user asks to build web components, pages, or applications. Generates creative, polished code that avoids generic AI aesthetics.
license: Complete terms in LICENSE.txt
---

This skill guides creation of distinctive, production-grade frontend interfaces that avoid generic "AI slop" aesthetics. Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Thinking

Before coding, understand the context and commit to a BOLD aesthetic direction:
- **Purpose**: What problem does this interface solve? Who uses it?
- **Tone**: Pick an extreme: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian, etc. There are so many flavors to choose from. Use these for inspiration but design one that is true to the aesthetic direction.
- **Constraints**: Technical requirements (framework, performance, accessibility).
- **Differentiation**: What makes this UNFORGETTABLE? What's the one thing someone will remember?

**CRITICAL**: Choose a clear conceptual direction and execute it with precision. Bold maximalism and refined minimalism both work — the key is intentionality, not intensity.

Then implement working code (HTML/CSS/JS, React, Vue, etc.) that is:
- Production-grade and functional
- Visually striking and memorable
- Cohesive with a clear aesthetic point-of-view
- Meticulously refined in every detail

## Recommended Tech Stack

When the user doesn't specify a stack, use these defaults by framework:

| Context | Stack |
|---|---|
| React (default) | **Tailwind CSS v4** + **Radix UI** + **Motion** (ex-Framer Motion) + **shadcn/ui** |
| Vue | **Tailwind CSS v4** + **Radix Vue** + **Motion Vue** |
| Vanilla HTML/CSS/JS | **Tailwind CSS v4** (CDN) + native CSS animations + **Motion standalone** |

### Why this stack
- **Tailwind CSS v4**: Utility-first, design tokens via `@theme`, container queries, `@starting-style`, no purge config needed
- **Radix UI**: Unstyled, accessible primitives (Dialog, Popover, DropdownMenu, Tabs etc.) — handles keyboard nav, focus trapping, ARIA
- **Motion** (by Matt Perry): Spring physics, layout animations, AnimatePresence, scroll-linked, gestures — 30M npm downloads/month, successor to Framer Motion
- **shadcn/ui**: Copy-paste components built on Radix + Tailwind — not a dependency, you own the code

### Alternatives
- **Panda CSS** / **UnoCSS** — if Tailwind doesn't fit
- **react-aria-components** — if you need more accessibility control than Radix
- **GSAP** — for timeline-heavy complex animations (but prefer Motion)
- **CSS-only** — prefer this for simple transitions, keyframe animations, scroll-driven `view-timeline`

## Frontend Aesthetics Guidelines

### Typography
- **Display fonts**: Choose characterful, unexpected fonts (Instrument Serif, Domaine Display, Kartick, Editorial New, etc.)
- **Body fonts**: Pair with refined readable fonts (Source Serif, FF Meta, IBM Plex Sans, Satoshi, etc.)
- **Scale**: Use a modular scale (1.25 or 1.333). Define as CSS variables: `--text-sm`, `--text-base`, `--text-lg`, etc.
- **Avoid**: Inter, Roboto, Arial, system-ui stack, Space Grotesk (overused by AI)
- **Loading**: Use `@font-face` with `font-display: swap` + `preload` for critical fonts

### Color & Theme
- **Dark mode by default**: Implement both, default to dark unless context suggests otherwise. Use `prefers-color-scheme` + class toggle.
- **Color system**: Define via CSS custom properties:
  ```css
  :root {
    --bg: oklch(98% 0.01 85);
    --fg: oklch(15% 0.03 85);
    --accent: oklch(55% 0.25 280);
    --surface: oklch(93% 0.01 85);
    --border: oklch(88% 0.01 85);
  }
  ```
- **OKLCH**: Use OKLCH color space for perceptually uniform gradients and consistent lightness. Avoid HSL.
- **Dominant color**: Pick ONE hero color (60% of palette), ONE accent (10%), neutrals (30%). Sharp accents beat timid palettes.
- **Surface hierarchy**: 3-4 surface levels (bg → surface → elevated → overlay) via lightness deltas
- **Semantic tokens**: `--color-success`, `--color-warning`, `--color-error` — defined as OKLCH

### Spatial Composition
- **Unexpected layouts**: Asymmetry, overlap, diagonal flow, grid-breaking elements
- **Negative space**: Generous for refined/editorial looks; controlled density for data-heavy/playful
- **CSS Grid**: Use named grid areas for intentional layout. `subgrid` for aligning nested content.
- **Container queries**: `@container (min-width: ...)` for truly responsive components — not just viewport-based
- **The `has()` selector**: `card:has(button.primary)` for context-aware styling without JS

### Backgrounds & Visual Details
- **Atmosphere**: Gradient meshes, noise textures (SVG filter or CSS `@keyframes` noise), geometric patterns
- **Depth**: Layered transparencies, dramatic shadows (`box-shadow` with `oklch`), `backdrop-filter: blur()`
- **Details**: decorative borders, custom cursors, grain overlays, subtle `::before`/`::after` ornaments

### Modern CSS Features (use these)
| Feature | Usage |
|---|---|
| `oklch()` | Perceptually uniform colors |
| `@container` | Component-level responsive design |
| `:has()` | Parent-selector logic |
| `@starting-style` | Enter animations without JS |
| `view-timeline` | Scroll-driven animations (CSS-only) |
| `subgrid` | Aligned nested grids |
| `linear()` easing | Custom spring/bounce curves in CSS |
| `overscroll-behavior` | Control scroll chaining |
| `scroll-timeline` / `view-timeline` | Scroll-linked animations |
| `light-dark()` | Two-value color for theme switching |

## Responsive & Mobile-First Design

- **Mobile-first**: Design for the smallest viewport first, then enhance with `@media (min-width: ...)`
- **Breakpoints**: Use semantic breakpoints, not device-specific ones:
  ```css
  @theme {
    --breakpoint-sm: 40rem;   /* 640px */
    --breakpoint-md: 48rem;   /* 768px */
    --breakpoint-lg: 64rem;   /* 1024px */
    --breakpoint-xl: 80rem;   /* 1280px */
    --breakpoint-2xl: 96rem;  /* 1536px */
  }
  ```
- **Container queries**: Prefer `@container` over `@media` for component-level responsiveness
- **Touch targets**: Minimum 44×44dp for all interactive elements
- **Viewport units**: Use `dvh`/`svh`/`lvh` for full-height layouts (not `100vh`)
- **Safe areas**: Respect `env(safe-area-inset-*)` for notched devices
- **Font size**: Minimum 16px on inputs to prevent iOS zoom (`text-base`)
- **Hover states**: Wrap in `@media (hover: hover)` — touch devices don't have hover

## State Management Guidelines

### Choosing the right solution

| State type | Solution | When |
|---|---|---|
| **Local UI** | `useState`, `useReducer` | Component-only state (toggle, form input) |
| **Shared UI** | React Context | Theme, auth, locale (low-frequency updates) |
| **Global app** | Zustand / Jotai | Complex shared state, cross-component |
| **Server state** | TanStack Query / SWR | API data, caching, deduping, background updates |
| **Form state** | React Hook Form + Zod | Complex forms with validation |
| **URL state** | Next.js useSearchParams / TanStack Router | Shareable, bookmarkable filters |

### Rules
- Keep state as close to where it's used as possible (colocation)
- Derive values with selectors, don't duplicate state
- Use URL state for anything the user might want to share or bookmark
- Server state and client state are different — don't mix them
- Form validation: schema-first with Zod, not manual checks

## Design Tokens System

Define a complete token layer in CSS custom properties:

```css
:root {
  /* Colors (OKLCH) */
  --color-bg: oklch(98% 0.01 85);
  --color-fg: oklch(15% 0.03 85);
  --color-accent: oklch(55% 0.25 280);
  --color-muted: oklch(60% 0.05 85);
  --color-border: oklch(88% 0.01 85);
  --color-surface: oklch(93% 0.01 85);
  --color-elevated: oklch(96% 0.01 85);
  --color-overlay: oklch(10% 0.02 85 / 0.8);

  /* Semantic colors */
  --color-success: oklch(65% 0.22 145);
  --color-warning: oklch(75% 0.18 85);
  --color-error: oklch(55% 0.22 25);
  --color-info: oklch(65% 0.18 250);

  /* Typography scale (modular 1.25) */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */

  /* Spacing scale */
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */

  /* Elevation (shadows) */
  --shadow-sm: 0 1px 2px oklch(0% 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px oklch(0% 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px oklch(0% 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px oklch(0% 0 0 / 0.1);

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;

  /* Z-index scale */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 300;
  --z-popover: 400;
  --z-toast: 500;
  --z-tooltip: 600;
}
```

## Component Implementation Recipes

### Recipe: Composed component with Radix + Tailwind + Motion
```tsx
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

export function Modal({ open, onOpenChange, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 10 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl bg-[var(--bg)] p-6 shadow-xl border border-[var(--border)]"
              >
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
```

### Recipe: Stagger reveal on scroll
```tsx
import { motion } from "motion/react";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 350, damping: 25 } },
};

export function Grid({ items }) {
  return (
    <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-50px" }}
      className="grid grid-cols-3 gap-6"
    >
      {items.map((item) => (
        <motion.div key={item.id} variants={item} className="..." />
      ))}
    </motion.div>
  );
}
```

### Recipe: Noise texture overlay
```css
.noise::after {
  content: "";
  position: fixed;
  inset: 0;
  opacity: 0.035;
  pointer-events: none;
  background-image: url("data:image/svg+xml,...");
  background-repeat: repeat;
  background-size: 256px 256px;
}
```
Or CSS-only animated noise:
```css
@keyframes noise {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5%, -10%); }
  20% { transform: translate(-15%, 5%); }
  /* ... more keyframes */
}
```

### Recipe: Drawer / Sheet (mobile slide-up)
```tsx
import * as Dialog from "@radix-ui/react-dialog";
import { motion, AnimatePresence } from "motion/react";

export function Drawer({ open, onOpenChange, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed bottom-0 left-0 right-0 rounded-t-2xl bg-[var(--color-bg)] p-6 max-h-[85dvh]"
              >
                <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--color-border)]" />
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
```

### Recipe: Command palette (Cmd+K)
```tsx
import { useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";

export function CommandPalette({ commands, open, onOpenChange }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-lg rounded-xl bg-[var(--color-bg)] border border-[var(--color-border)] shadow-xl p-4">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(0); }}
            placeholder="Type a command..."
            className="w-full bg-transparent border-b border-[var(--color-border)] pb-3 mb-2 outline-none"
            role="combobox"
            aria-expanded={filtered.length > 0}
            aria-controls="command-list"
            aria-activedescendant={filtered[selected]?.id}
          />
          <ul id="command-list" role="listbox">
            {filtered.map((cmd, i) => (
              <li
                key={cmd.id}
                id={cmd.id}
                role="option"
                aria-selected={i === selected}
                className={`px-3 py-2 rounded-md cursor-pointer ${i === selected ? 'bg-[var(--color-surface)]' : ''}`}
                onClick={() => { cmd.action(); onOpenChange(false); }}
              >
                {cmd.label}
              </li>
            ))}
          </ul>
          <div aria-live="polite" className="sr-only">
            {filtered.length} results available
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Recipe: Toast / Notification system
```tsx
import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";

function useToast() {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((message, type = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, add, remove };
}

export function Toaster({ toasts, remove }) {
  return (
    <div className="fixed bottom-4 right-4 z-[var(--z-toast)] flex flex-col gap-2" role="region" aria-label="Notifications">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="rounded-lg px-4 py-3 shadow-lg border min-w-[300px]"
            style={{
              background: toast.type === "error" ? "var(--color-error)" : "var(--color-surface)",
              color: toast.type === "error" ? "white" : "var(--color-fg)",
            }}
          >
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

### Recipe: Data table with sort
```tsx
import { useState } from "react";

export function DataTable({ columns, data }) {
  const [sort, setSort] = useState({ key: null, dir: "asc" });

  const sorted = sort.key
    ? [...data].sort((a, b) => {
        const cmp = a[sort.key] < b[sort.key] ? -1 : 1;
        return sort.dir === "asc" ? cmp : -cmp;
      })
    : data;

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--color-surface)]">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className="px-4 py-3 font-medium cursor-pointer select-none"
                onClick={() =>
                  setSort({
                    key: col.key,
                    dir: sort.key === col.key && sort.dir === "asc" ? "desc" : "asc",
                  })
                }
                aria-sort={sort.key === col.key ? `${sort.dir}ending` : "none"}
              >
                {col.label}
                {sort.key === col.key && (sort.dir === "asc" ? " ↑" : " ↓")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, i) => (
            <tr key={row.id ?? i} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface)]">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Recipe: Form with Zod + React Hook Form
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormData = z.infer<typeof schema>;

export function LoginForm({ onSubmit }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          {...register("email")}
          className="w-full rounded-md border border-[var(--color-border)] px-3 py-2"
          aria-invalid={errors.email ? "true" : "false"}
          aria-describedby={errors.email ? "email-error" : undefined}
        />
        {errors.email && (
          <p id="email-error" role="alert" className="text-sm text-[var(--color-error)] mt-1">
            {errors.email.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          {...register("password")}
          className="w-full rounded-md border border-[var(--color-border)] px-3 py-2"
          aria-invalid={errors.password ? "true" : "false"}
          aria-describedby={errors.password ? "password-error" : undefined}
        />
        {errors.password && (
          <p id="password-error" role="alert" className="text-sm text-[var(--color-error)] mt-1">
            {errors.password.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-[var(--color-accent)] text-white px-4 py-2 disabled:opacity-50"
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </form>
  );
}
```

### Recipe: Tabs with animated content
```tsx
import * as Tabs from "@radix-ui/react-tabs";
import { motion } from "motion/react";

export function AnimatedTabs({ tabs }) {
  return (
    <Tabs.Root defaultValue={tabs[0].id}>
      <Tabs.List className="flex gap-1 rounded-lg bg-[var(--color-surface)] p-1">
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.id}
            value={tab.id}
            className="relative px-4 py-2 text-sm font-medium rounded-md data-[state=active]:text-[var(--color-fg)] text-[var(--color-muted)] transition-colors"
          >
            {tab.label}
            <motion.div
              layoutId="active-tab"
              className="absolute inset-0 rounded-md bg-[var(--color-bg)] shadow-sm -z-10"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{ display: "none" }}
            />
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {tabs.map((tab) => (
        <Tabs.Content key={tab.id} value={tab.id} className="mt-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            {tab.content}
          </motion.div>
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
```

### Recipe: Accordion
```tsx
import * as Accordion from "@radix-ui/react-accordion";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

export function AnimatedAccordion({ items }) {
  return (
    <Accordion.Root type="single" collapsible className="space-y-2">
      {items.map((item) => (
        <Accordion.Item
          key={item.id}
          value={item.id}
          className="rounded-lg border border-[var(--color-border)] overflow-hidden"
        >
          <Accordion.Trigger className="flex w-full items-center justify-between px-4 py-3 text-left font-medium hover:bg-[var(--color-surface)] transition-colors [&[data-state=open]>svg]:rotate-180">
            {item.title}
            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
          </Accordion.Trigger>
          <Accordion.Content asChild>
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <div className="px-4 pb-3 text-[var(--color-muted)]">
                {item.content}
              </div>
            </motion.div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
```

### Recipe: Skeleton loading state
```tsx
export function Skeleton({ className }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[var(--color-surface)] ${className}`}
      aria-hidden="true"
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-xl border border-[var(--color-border)] p-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}
```

### Recipe: Error boundary
```tsx
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-lg border border-[var(--color-error)] bg-[var(--color-error)]/10 p-6 text-center">
            <h2 className="text-lg font-semibold text-[var(--color-error)] mb-2">
              Something went wrong
            </h2>
            <p className="text-sm text-[var(--color-muted)] mb-4">
              {this.state.error?.message}
            </p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white"
            >
              Try again
            </button>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
```

### Recipe: Suspense + loading UI
```tsx
import { Suspense, lazy } from "react";

const HeavyDashboard = lazy(() => import("./HeavyDashboard"));

function LoadingFallback() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-8 w-1/3 animate-pulse rounded bg-[var(--color-surface)]" />
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-lg bg-[var(--color-surface)]" />
        ))}
      </div>
    </div>
  );
}

export function DashboardPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HeavyDashboard />
    </Suspense>
  );
}
```

## Resources & References

Direct the agent to study these for inspiration before designing:
- **Josh W. Comeau** (joshwcomeau.com) — interactive CSS/React tutorials, "Joy of React", "Whimsical Animations"
- **Build UI** (buildui.com) — Sam Selikoff's Radix + Tailwind + Motion patterns
- **animations.dev** — Emil Kowalski's animation course (spring physics, easing, taste)
- **Motion docs** (motion.dev/docs) — reference for all animation APIs
- **shadcn/ui** (ui.shadcn.com) — component examples and blocks
- **Linear Design** — reference for refined, functional UI
- **Vercel Geist** (vercel.com/geist) — design system reference

## NEVER use
- Fonts: Inter, Roboto, Arial, system-ui stack, Space Grotesk
- Colors: Purple gradients on white (#purple → #blue), naive HSL
- Layouts: Centered card on white background, predictable hero-section patterns
- Components: Cookie-cutter navbars, generic dashboard layouts without character
- Every generation should vary light/dark, fonts, aesthetic direction

**IMPORTANT**: Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate code with extensive animations and effects. Minimalist or refined designs need restraint, precision, and careful attention to spacing, typography, and subtle details. Elegance comes from executing the vision well.

Remember: AI is capable of extraordinary creative work. Don't hold back, show what can truly be created when thinking outside the box and committing fully to a distinctive vision.
