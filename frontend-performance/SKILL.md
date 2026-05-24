---
name: frontend-performance
description: Build fast, efficient frontend applications. Use this skill when creating components, pages, or applications where loading speed, runtime performance, or bundle size matter. Covers Core Web Vitals, image optimization, font loading, code splitting, caching, and runtime performance.
license: Complete terms in LICENSE.txt
---

This skill ensures every frontend output is fast, efficient, and scores well on Core Web Vitals. Performance is a feature — not an optimization to defer.

## Core Web Vitals (CWV)

Google uses these metrics for search ranking. Every page should meet these thresholds.

| Metric | Good | Poor | What it measures |
|---|---|---|---|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | > 4.0s | Time until largest visible element renders |
| **INP** (Interaction to Next Paint) | ≤ 200ms | > 500ms | Responsiveness to user interactions |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | > 0.25 | Visual stability (unexpected layout shifts) |
| **TTFB** (Time to First Byte) | ≤ 800ms | > 1.8s | Server response time |
| **FCP** (First Contentful Paint) | ≤ 1.8s | > 3.0s | Time until first content renders |

### How to measure
- **Lighthouse** (Chrome DevTools) — synthetic testing
- **web-vitals** JS library — real user monitoring (RUM)
- **Chrome UX Report** (CrUX) — field data from real users
- **PageSpeed Insights** — combines lab + field data

```tsx
import { onLCP, onINP, onCLS, onFCP, onTTFB } from "web-vitals";

onLCP(console.log);
onINP(console.log);
onCLS(console.log);
```

---

## Image Optimization

Images are usually the largest contributor to LCP. Optimize aggressively.

### Modern formats
- **AVIF** — best compression, use if browser supports it
- **WebP** — excellent compression, broad support
- **JPEG** — fallback for photos
- **PNG** — only for images needing transparency (prefer WebP/AVIF)
- **SVG** — icons, logos, illustrations (inline small ones, external large ones)

### Responsive images
```html
<picture>
  <source srcset="image.avif" type="image/avif" />
  <source srcset="image.webp" type="image/webp" />
  <img
    src="image.jpg"
    alt="Description"
    width="800"
    height="600"
    loading="lazy"
    decoding="async"
  />
</picture>
```

### Sizing
- **ALWAYS specify `width` and `height`** — prevents CLS
- Use `srcset` + `sizes` for responsive images:
  ```html
  <img
    srcset="img-400.jpg 400w, img-800.jpg 800w, img-1200.jpg 1200w"
    sizes="(max-width: 600px) 400px, (max-width: 1000px) 800px, 1200px"
    src="img-800.jpg"
    alt="..."
    width="800"
    height="600"
  />
  ```

### Lazy loading
- **Below-the-fold images**: `loading="lazy"`
- **Above-the-fold images (LCP candidate)**: `loading="eager"` (default) or `fetchpriority="high"`
- **LCP image**: Add `fetchpriority="high"` and `rel="preload"` in `<head>`

```html
<link rel="preload" as="image" href="/hero.avif" type="image/avif" />
```

### LQIP (Low Quality Image Placeholders)
Show a tiny blurred version while loading:
```tsx
<div className="relative">
  <img src="placeholder-20x15.jpg" className="absolute inset-0 blur-lg" aria-hidden="true" />
  <img src="full-image.jpg" className="relative" loading="lazy" />
</div>
```

Or use a solid color placeholder extracted from the image's dominant color.

---

## Font Loading

Fonts are often the LCP blocker. Load them efficiently.

### font-display strategy
```css
@font-face {
  font-family: "MyFont";
  src: url("/fonts/myfont.woff2") format("woff2");
  font-display: swap;   /* Show fallback immediately, swap when loaded */
  /* alternatives: block (FOIT), optional (may never swap) */
}
```

- **`swap`** — best for body text (FOUT but readable immediately)
- **`optional`** — best for decorative fonts (may never load on slow connections)
- **`block`** — avoid (invisible text during load)

### Preload critical fonts
```html
<link rel="preload" href="/fonts/body-regular.woff2" as="font" type="font/woff2" crossorigin />
```

Only preload 1-2 critical fonts. Over-preloading hurts performance.

### Variable fonts
Use variable fonts to reduce HTTP requests:
```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter.var.woff2") format("woff2-variations");
  font-weight: 100 900;  /* Full range */
  font-display: swap;
}
```

One file replaces 18+ static font files.

### Font subsetting
Include only the glyphs you need:
```css
/* Latin subset ~ 20KB vs full ~ 100KB+ */
unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
```

### System font stack (fallback)
```css
font-family: "MyFont", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
```

### Size-adjust for reduced CLS
```css
@font-face {
  font-family: "MyFont";
  src: url("/fonts/myfont.woff2") format("woff2");
  size-adjust: 107%;  /* Match x-height to fallback font */
  ascent-override: 95%;
  descent-override: 20%;
}
```

---

## Code Splitting & Lazy Loading

### Route-based splitting
```tsx
// Next.js / React Router
const Dashboard = lazy(() => import("./pages/Dashboard"));

function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}
```

### Component-level splitting
```tsx
const HeavyChart = lazy(() => import("./HeavyChart"));

function Analytics() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

### Preloading on interaction
```tsx
function LinkToDashboard() {
  return (
    <Link
      to="/dashboard"
      onMouseEnter={() => import("./pages/Dashboard")}  // Preload on hover
    >
      Dashboard
    </Link>
  );
}
```

### Dynamic imports for heavy libraries
```tsx
// Only load PDF viewer when needed
async function openPDF(url) {
  const { default: PDFViewer } = await import("pdf-lib");
  // ...
}
```

---

## Bundle Optimization

### Tree shaking
- Use ES modules (`import { foo } from "lib"` not `const lib = require("lib")`)
- Ensure `sideEffects: false` in library package.json
- Import only what you need:
  ```tsx
  // Good
  import { format } from "date-fns";
  // Better (smaller bundle)
  import format from "date-fns/format";
  ```

### Bundle analysis
```bash
# Analyze your bundle
npx vite-bundle-visualizer
# or
npx @next/bundle-analyzer
```

### Dependency choices
- Prefer smaller libraries: `zustand` > `redux`, `motion` > `GSAP` (for simple cases)
- Check bundle size before adding: bundlephobia.com
- Avoid polyfills for modern browsers (use `browserslist`)

---

## Runtime Performance

### React specifics
- **Avoid re-renders**: Use `React.memo`, `useMemo`, `useCallback` — but only after profiling
- **Virtualize long lists**: `react-window` or `@tanstack/react-virtual` for 100+ items
- **Debounce / throttle**: Search inputs, resize handlers, scroll events
- **Use `useTransition`**: For non-urgent updates (filtering large datasets)
- **Use `useDeferredValue`**: For deferred rendering of expensive components

```tsx
const [isPending, startTransition] = useTransition();

function handleSearch(query) {
  startTransition(() => {
    setSearchQuery(query);  // Non-urgent, can be interrupted
  });
}
```

### INP optimization
- Break up long tasks (> 50ms) with `yieldToMain()`:
  ```ts
  await scheduler.yield();  // Chrome 115+
  ```
- Use `requestIdleCallback` for non-critical work
- Offload heavy computation to Web Workers

### Animation performance
- Animate only `transform` and `opacity` (GPU-composited)
- Use `will-change` sparingly and remove after animation
- Use CSS animations over JS for simple transitions
- Batch DOM reads/writes (avoid layout thrashing)

```tsx
// BAD: interleaving reads and writes
const height = element.offsetHeight;  // read (layout)
element.style.height = height + 10 + "px";  // write (layout)
const newHeight = element.offsetHeight;  // read (layout forced!)

// GOOD: batch reads then writes
const heights = elements.map(el => el.offsetHeight);  // all reads
elements.forEach((el, i) => {
  el.style.height = heights[i] + 10 + "px";  // all writes
});
```

### Memory management
- Clean up event listeners, intervals, subscriptions in `useEffect` cleanup
- Remove large objects from state when not needed
- Use `WeakRef` and `FinalizationRegistry` for cache eviction (advanced)

---

## Caching Strategies

### Static assets
```html
<!-- Cache fonts and images for 1 year -->
<filesMatch "\.(woff2|avif|webp|png|jpg)$">
  Header set Cache-Control "public, max-age=31536000, immutable"
</filesMatch>
```

### API responses
- Use SWR or TanStack Query for client-side caching
- Set appropriate `Cache-Control` headers
- Use ETags for conditional requests

### Service Worker (PWA)
```tsx
// Workbox for precaching and runtime caching
import { precacheAndRoute } from "workbox-precaching";
precacheAndRoute(self.__WB_MANIFEST);
```

---

## Critical CSS

Inline critical CSS in `<head>` to avoid render-blocking:
```html
<head>
  <style>
    /* Critical above-the-fold styles */
    :root { --bg: oklch(98% 0.01 85); }
    body { margin: 0; font-family: "MyFont", sans-serif; }
    /* ... ~10-14KB max */
  </style>
  <link rel="preload" href="/styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'" />
  <noscript><link rel="stylesheet" href="/styles.css" /></noscript>
</head>
```

---

## Third-Party Scripts

Third-party scripts are a major performance killer.

### Load strategies
```html
<!-- Async: download in parallel, execute when ready -->
<script async src="analytics.js"></script>

<!-- Defer: download in parallel, execute after HTML parse -->
<script defer src="app.js"></script>

<!-- Lazy: load only when needed -->
<script>
  // Load chat widget after user interaction
  document.querySelector('.chat-trigger').addEventListener('click', () => {
    import('./chat-widget.js');
  });
</script>
```

### Preconnect to third-party origins
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="dns-prefetch" href="https://api.example.com" />
```

### Use `loading="lazy"` for iframes
```html
<iframe src="embed.html" loading="lazy" title="Embedded content"></iframe>
```

---

## Performance Recipes

### Recipe: Optimized image component
```tsx
function OptimizedImage({ src, alt, width, height, priority = false }) {
  const ext = src.split('.').pop();
  const avifSrc = src.replace(`.${ext}`, '.avif');
  const webpSrc = src.replace(`.${ext}`, '.webp');

  return (
    <picture>
      <source srcSet={avifSrc} type="image/avif" />
      <source srcSet={webpSrc} type="image/webp" />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchpriority={priority ? "high" : "auto"}
        style={{ maxWidth: "100%", height: "auto" }}
      />
    </picture>
  );
}
```

### Recipe: Virtualized list
```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualList({ items }) {
  const parentRef = useRef(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });

  return (
    <div ref={parentRef} style={{ height: "400px", overflow: "auto" }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Recipe: Debounced search input
```tsx
import { useState, useEffect, useRef } from "react";

function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function Search() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (debouncedQuery) searchAPI(debouncedQuery);
  }, [debouncedQuery]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

---

## Performance Checklist

Before shipping, verify:
- [ ] LCP < 2.5s (Lighthouse mobile)
- [ ] INP < 200ms (CrUX or web-vitals)
- [ ] CLS < 0.1 (no layout shifts)
- [ ] Images use modern formats (WebP/AVIF) with width/height
- [ ] Above-the-fold images preloaded
- [ ] Fonts use `font-display: swap`
- [ ] Critical fonts preloaded (1-2 max)
- [ ] Routes/components lazy loaded where appropriate
- [ ] Bundle analyzed and large dependencies justified
- [ ] Long lists virtualized
- [ ] Animations use only transform/opacity
- [ ] Third-party scripts loaded async/defer or on interaction
- [ ] Cache headers set for static assets

## References
- **web.dev/vitals** — Core Web Vitals documentation
- **web.dev/fast** — Comprehensive performance guides
- **Lighthouse** — Chrome DevTools auditing
- **Bundlephobia** — bundlephobia.com (check package sizes)
- **WebPageTest** — webpagetest.org (detailed waterfall analysis)
