# Layout Patterns Reference

Detailed layout specification for the frontend-design skill. Read this when you need specific grid configurations, section composition patterns, or responsive layout strategies.

## Table of Contents
1. [Visual Hierarchy Deep Dive](#visual-hierarchy-deep-dive)
2. [Grid System Details](#grid-system-details)
3. [Section Layout Patterns](#section-layout-patterns)
4. [Responsive Strategies](#responsive-strategies)
5. [CSS Grid and Flexbox Patterns](#css-grid-and-flexbox-patterns)

---

## Visual Hierarchy Deep Dive

### The Four Tools of Hierarchy

**1. Contrast**
- Primary element: highest contrast (white text on dark bg, or dark text on light bg)
- Secondary elements: reduced contrast (70-80% opacity text)
- Tertiary elements: lowest contrast (50-60% opacity)
- Use contrast to create a clear reading order

**2. Size**
- Hero headline: 48-72px (the first thing read)
- Section title: 30-48px (section entry point)
- Card title: 20-24px (content unit entry point)
- Body: 16-18px (reading content)
- Caption: 12-14px (supporting info)

**3. Color**
- Accent color draws attention first (use for CTAs, highlights, badges)
- Primary color establishes brand presence
- Neutral colors recede (backgrounds, secondary text)
- Limit high-saturation usage to <15% of the visible area

**4. Whitespace**
- More space around an element = more importance
- Hero sections: generous 120-160px vertical padding
- Dense sections (grids, lists): tighter 64-96px vertical padding
- Group related items with less space between them (Gestalt proximity)

### Variation and Balance

Avoid visual monotony by alternating between:
- Text-heavy and visual sections
- Full-width and contained layouts
- Light and dark background sections
- Dense grids and open whitespace
- Left-aligned and centered content

**Balance Rule:** No two consecutive sections should have the same layout structure. If section A is a centered 3-column card grid, section B should be a left-aligned text+image split or a full-width statement.

---

## Grid System Details

### Single Column (1-col)

```
[            Full Width Content            ]
```

**Use for:** Hero sections, mission statements, CTAs, testimonials (single), full-width images/videos.

**Best practices:**
- Center content horizontally
- Limit text width to 65ch for readability
- Use generous vertical padding (120-160px)
- Asymmetric placement works well for hero - offset text left with visual right

### Two Column (2-col)

```
[    Content A    ] [    Content B    ]
     55-60%              40-45%
```

**Use for:** Text + image, feature highlight + illustration, form + explanation.

**Best practices:**
- Asymmetric split (55/45 or 60/40) is more dynamic than 50/50
- The larger column gets the primary content
- Vertically center content in both columns
- Reverse order on alternate rows for visual flow
- On mobile: stack vertically, image first

### Three Column (3-col)

```
[  Card A  ] [  Card B  ] [  Card C  ]
    33%          33%          33%
```

**Use for:** Feature cards, pricing tiers, team members, how-it-works steps.

**Best practices:**
- Equal-width columns for equal-weight items
- Use cards with consistent internal structure
- Maximum comfortable count: 3-4 items per row
- On mobile: stack to single column
- On tablet: keep 3 or reduce to 2+1

### Four Column (4-col)

```
[ A ] [ B ] [ C ] [ D ]
 25%   25%   25%   25%
```

**Use for:** Feature grids with icons, stats/metrics, dashboard widgets.

**Best practices:**
- Keep content per column minimal (icon + title + 1-2 line description)
- Works best with visual elements (icons, illustrations)
- On tablet: 2x2 grid
- On mobile: single column or 2x2

### Five Column (5-col)

```
[ A ] [ B ] [ C ] [ D ] [ E ]
```

**Use for:** Logo bars, icon rows, small avatar groups.

**Best practices:**
- Only for slim, visual-only content (logos, icons, avatars)
- No text blocks in 5-col layouts
- On tablet: wrap to 3+2
- On mobile: wrap to 2+2+1 or use horizontal scroll

---

## Section Layout Patterns

### Hero Section Variants

**Centered Hero:**
```
         [Tag/Label]
     [  Large Headline  ]
      [  Subheadline  ]
    [CTA Primary] [CTA Secondary]
         [Hero Image/Video]
```
Best for: SaaS, apps, broad audience products.

**Split Hero:**
```
[  Headline       ] [              ]
[  Subheadline    ] [   Image/3D   ]
[  CTA Buttons    ] [   Element    ]
```
Best for: Products with strong visuals, feature-focused landing pages.

**Full-Screen Hero:**
```
[                                    ]
[      Background Video/Image        ]
[         Centered Content           ]
[                                    ]
```
Best for: Luxury, creative, portfolio, immersive brands.

### Feature Section Variants

**Icon Grid:**
```
[icon] Title    [icon] Title    [icon] Title
Description     Description     Description

[icon] Title    [icon] Title    [icon] Title
Description     Description     Description
```

**Bento Box:**
```
[  Large Feature Card (2x2)  ] [ Small Card ]
                                [ Small Card ]
[ Small Card ] [ Small Card ]  [ Wide Card   ]
```

**Alternating Feature:**
```
Row 1: [Image]  [Text + CTA]
Row 2: [Text + CTA]  [Image]
Row 3: [Image]  [Text + CTA]
```

### Testimonial Section Variants

**Carousel:** Single testimonial at a time, auto-scroll or manual navigation.
**Grid:** 3 testimonials side-by-side (desktop), stacked (mobile).
**Marquee:** Continuously scrolling horizontal strip of testimonial cards.

### Pricing Section

```
[ Free Plan  ] [* Pro Plan *] [ Enterprise ]
  Features      Features        Features
  [Button]      [Button]        [Contact]
```

- Recommended/popular plan: highlighted with border or badge
- Keep feature lists scannable (checkmarks + short text)
- Enterprise: "Contact us" instead of price

### FAQ Section

Accordion pattern with expand/collapse:
```
[+] Question one
[-] Question two
    Answer text visible when expanded
[+] Question three
```

- 5-8 questions typical
- Start all collapsed
- Single-expand or multi-expand (either works)

---

## Responsive Strategies

### Mobile-First Approach

Start with mobile layout, then add complexity:
```css
/* Mobile default: single column stack */
.grid { display: flex; flex-direction: column; gap: 16px; }

/* Tablet: 2 columns */
@media (min-width: 768px) {
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
}

/* Desktop: 3 columns */
@media (min-width: 1200px) {
  .grid { grid-template-columns: repeat(3, 1fr); gap: 24px; }
}
```

### Navigation Responsive Pattern

Desktop: Horizontal link bar with CTA button
Tablet: Hamburger with full-height slide-in tray from right
Mobile: Same hamburger pattern

```
Desktop:  [Logo]  Home  Features  Pricing  Blog  [Sign Up]
Tablet:   [Logo]                                  [Burger]
Mobile:   [Logo]                                  [Burger]
```

**Mobile menu tray:**
- Full viewport height
- Dark/frosted overlay on content
- Animate in from right: translateX(100%) -> translateX(0)
- Animate out: reverse
- Include social links and CTA at bottom of tray

### Content Reordering

Use CSS `order` property to rearrange content on mobile:
```css
/* On desktop: image right, text left */
/* On mobile: image first, text second */
.feature-image { order: 2; }
.feature-text  { order: 1; }

@media (max-width: 767px) {
  .feature-image { order: 1; }
  .feature-text  { order: 2; }
}
```

---

## CSS Grid and Flexbox Patterns

### Auto-Fit Responsive Grid

```css
/* Cards automatically wrap to available space */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}
```

### Bento Grid

```css
.bento {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 200px;
  gap: 16px;
}

.bento-large {
  grid-column: span 2;
  grid-row: span 2;
}

.bento-wide {
  grid-column: span 2;
}

.bento-tall {
  grid-row: span 2;
}
```

### Centered Content Container

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 clamp(16px, 4vw, 48px);
}
```

### Sticky Header with Backdrop Blur

```css
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(var(--bg-rgb), 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(var(--border-rgb), 0.1);
  transition: background 0.3s ease;
}
```
