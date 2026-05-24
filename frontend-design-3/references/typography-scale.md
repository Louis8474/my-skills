# Typography Scale Reference

Detailed typography specification for the frontend-design skill. Read this when you need specific font pairing recommendations, specimen details, or advanced typographic patterns.

## Table of Contents
1. [Font Pairing Specimens](#font-pairing-specimens)
2. [Type Scale Variants](#type-scale-variants)
3. [Responsive Typography](#responsive-typography)
4. [Typographic Patterns](#typographic-patterns)
5. [CSS Implementation](#css-implementation)

---

## Font Pairing Specimens

### Premium Pairings (Display + Body)

**Modern Tech / SaaS:**
- Outfit (700) + DM Sans (400) - Clean geometric contrast
- Plus Jakarta Sans (700) + Manrope (400) - Rounded, approachable tech
- Satoshi (700) + Inter (400) - Sharp, developer-focused
- General Sans (600) + Work Sans (400) - Balanced neutrality

**Editorial / Magazine:**
- Playfair Display (700) + Source Sans 3 (400) - Classic elegance
- Instrument Serif (400) + DM Sans (400) - Contemporary editorial
- Fraunces (800) + Nunito Sans (400) - Bold personality

**Creative / Agency:**
- Clash Display (600) + Manrope (400) - Geometric statement
- Cabinet Grotesk (700) + Work Sans (400) - Industrial creative
- Space Grotesk (500) + Source Serif 4 (400) - Technical + literary contrast

**Luxury / Premium:**
- Cormorant Garamond (600) + Lora (400) - Refined serif-only
- Playfair Display (700) + Crimson Pro (400) - Classical luxury
- Instrument Serif (400) + Geist Sans (400) - Understated premium

**Developer / Technical:**
- JetBrains Mono (700) + DM Sans (400) - Code-native aesthetic
- Space Mono (700) + Manrope (400) - Retro-tech
- Fira Code (600) + Source Sans 3 (400) - Documentation-first

### Monospace Accent Usage

Use monospace fonts as a third accent for:
- Code snippets and technical labels
- Tags, badges, and metadata
- Version numbers and timestamps
- Terminal-style UI elements

Recommended monospace accents: JetBrains Mono, Fira Code, IBM Plex Mono, Geist Mono

---

## Type Scale Variants

### Minor Third (1.200) - Compact

Best for: Dashboards, data-dense interfaces, admin panels
```
12px / 14.4px / 17.28px / 20.74px / 24.88px / 29.86px / 35.83px
```

### Major Third (1.250) - Standard (Recommended Default)

Best for: Marketing sites, landing pages, general web
```
12px / 14px / 16px / 20px / 25px / 31.25px / 39.06px / 48.83px
```

### Perfect Fourth (1.333) - Dramatic

Best for: Editorial, portfolio, statement-heavy designs
```
12px / 16px / 21.33px / 28.43px / 37.9px / 50.52px / 67.34px
```

### Golden Ratio (1.618) - Bold

Best for: Hero-heavy single-page sites, art portfolios
```
12px / 19.42px / 31.4px / 50.81px / 82.18px
```

### Choosing Your Scale

- More content -> smaller ratio (1.200 - 1.250)
- More visual impact -> larger ratio (1.333 - 1.618)
- Mobile should use a smaller ratio than desktop (step down one level)

---

## Responsive Typography

### Fluid Scaling with clamp()

```css
/* Hero headline: 36px on mobile, scales to 72px on desktop */
.hero-title {
  font-size: clamp(2.25rem, 5vw + 1rem, 4.5rem);
  line-height: 1.1;
  letter-spacing: -0.03em;
}

/* Section headers: 24px on mobile, scales to 48px on desktop */
.section-title {
  font-size: clamp(1.5rem, 3vw + 0.5rem, 3rem);
  line-height: 1.15;
  letter-spacing: -0.02em;
}

/* Body text: 15px on mobile, scales to 18px on desktop */
.body-text {
  font-size: clamp(0.9375rem, 0.5vw + 0.8rem, 1.125rem);
  line-height: 1.6;
}
```

### Breakpoint-Based Scaling

If fluid scaling feels imprecise, use discrete breakpoints:

```css
:root {
  --text-hero: 2.25rem;    /* 36px mobile */
  --text-h1: 1.875rem;     /* 30px mobile */
  --text-h2: 1.5rem;       /* 24px mobile */
}

@media (min-width: 768px) {
  :root {
    --text-hero: 3.5rem;   /* 56px tablet */
    --text-h1: 2.5rem;     /* 40px tablet */
    --text-h2: 2rem;       /* 32px tablet */
  }
}

@media (min-width: 1200px) {
  :root {
    --text-hero: 4.5rem;   /* 72px desktop */
    --text-h1: 3rem;       /* 48px desktop */
    --text-h2: 2.25rem;    /* 36px desktop */
  }
}
```

---

## Typographic Patterns

### Hero Text Treatment

```css
.hero-title {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 6vw, 5rem);
  font-weight: 700;
  line-height: 1.05;
  letter-spacing: -0.03em;
  text-wrap: balance;  /* Prevents orphans */
}

.hero-subtitle {
  font-family: var(--font-body);
  font-size: clamp(1rem, 1.5vw, 1.25rem);
  font-weight: 400;
  line-height: 1.6;
  opacity: 0.7;  /* Creates hierarchy without extra color */
  max-width: 55ch;
}
```

### Gradient Text

```css
.gradient-text {
  background: linear-gradient(135deg, var(--color-primary), var(--color-accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Text with Highlight/Accent

```css
.highlight {
  color: var(--color-accent);
  font-style: italic;
  font-weight: 600;
}
```

### All-Caps Labels

```css
.label {
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-primary);
}
```

### Prose Optimization

```css
.prose {
  font-family: var(--font-body);
  font-size: 1.0625rem;   /* 17px - slightly above 16 for readability */
  line-height: 1.7;
  max-width: 65ch;         /* Optimal line length */
  color: hsl(var(--text) / 0.85);
}

.prose p + p {
  margin-top: 1.5em;       /* Generous paragraph spacing */
}
```

---

## CSS Implementation

### Font Loading Best Practices

```html
<!-- Preload critical fonts -->
<link rel="preload" href="/fonts/display.woff2" as="font" type="font/woff2" crossorigin>

<!-- Google Fonts approach -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=DM+Sans:wght@400;500&display=swap" rel="stylesheet">
```

### CSS Variables Setup

```css
:root {
  /* Font families */
  --font-display: 'Outfit', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Font sizes (Major Third scale) */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;
  --text-6xl: 3.75rem;
  --text-7xl: 4.5rem;

  /* Line heights */
  --leading-tight: 1.1;
  --leading-snug: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.65;
  --leading-loose: 1.8;

  /* Letter spacing */
  --tracking-tight: -0.03em;
  --tracking-normal: 0;
  --tracking-wide: 0.05em;
  --tracking-wider: 0.08em;
}
```

### Anti-Aliasing

```css
body {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}
```
