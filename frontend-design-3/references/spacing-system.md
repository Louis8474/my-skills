# Spacing System Reference

Detailed spacing and sizing specification for the frontend-design skill. Read this when you need precise padding/margin values, responsive spacing adjustments, or component sizing standards.

## Table of Contents
1. [The 8px Grid System](#the-8px-grid-system)
2. [Component Internal Padding](#component-internal-padding)
3. [Section Spacing](#section-spacing)
4. [Responsive Spacing](#responsive-spacing)
5. [CSS Implementation](#css-implementation)

---

## The 8px Grid System

All spacing values derive from an 8px base unit with a 4px half-step for fine adjustments. This creates visual rhythm and consistency across the entire interface.

### Why 8px

- Divides evenly into common screen resolutions
- Works cleanly at 1x, 1.5x, and 2x pixel densities
- Large enough to create visible rhythm, small enough for precision
- Industry standard used by Material Design, Apple HIG, and most design systems

### The Scale

| Token       | Value | Rem     | Common Uses |
|------------|-------|---------|-------------|
| `space-0.5`| 2px   | 0.125   | Hairline gaps, border offsets |
| `space-1`  | 4px   | 0.25    | Icon gaps, tight inline spacing |
| `space-2`  | 8px   | 0.5     | Inline element gaps, small padding |
| `space-3`  | 12px  | 0.75    | Form control padding, list gaps |
| `space-4`  | 16px  | 1       | Standard content padding, paragraph gap |
| `space-5`  | 20px  | 1.25    | Small card padding |
| `space-6`  | 24px  | 1.5     | Card padding, group spacing |
| `space-8`  | 32px  | 2       | Component spacing, subsection gaps |
| `space-10` | 40px  | 2.5     | Large component gaps |
| `space-12` | 48px  | 3       | Section internal padding |
| `space-16` | 64px  | 4       | Section spacing (mobile) |
| `space-20` | 80px  | 5       | Section spacing (tablet) |
| `space-24` | 96px  | 6       | Section spacing (desktop) |
| `space-32` | 128px | 8       | Major section spacing, hero padding |
| `space-40` | 160px | 10      | Hero section vertical padding |

---

## Component Internal Padding

### Buttons

```
Button SM:  padding: 6px 12px;    height: 32px;   font-size: 13px;
Button MD:  padding: 8px 16px;    height: 40px;   font-size: 14px;
Button LG:  padding: 12px 24px;   height: 48px;   font-size: 16px;
Button XL:  padding: 16px 32px;   height: 56px;   font-size: 18px;
```

**Icon buttons:** Square, with equal padding. SM: 32x32, MD: 40x40, LG: 48x48.

**Button spacing rules:**
- Gap between icon and text: 8px
- Gap between side-by-side buttons: 12px
- Minimum button width: 80px (prevent tiny tap targets)

### Cards

```
Card SM:     padding: 16px;        border-radius: 8px;
Card MD:     padding: 24px;        border-radius: 12px;
Card LG:     padding: 32px;        border-radius: 16px;
Card Hero:   padding: 40px-48px;   border-radius: 20px-24px;
```

**Card spacing rules:**
- Gap between card title and description: 8px
- Gap between description and CTA: 16px
- Gap between cards in a grid: 16px (SM), 20px (MD), 24px (LG)
- Card image to content gap: 16px-20px

### Form Elements

```
Input:         padding: 10px 12px;   height: 40px;   border-radius: 8px;
Input LG:      padding: 12px 16px;   height: 48px;   border-radius: 10px;
Textarea:      padding: 12px 14px;   min-height: 120px;
Select:        padding: 10px 12px;   height: 40px;
Checkbox/Radio: size: 20px;          gap to label: 8px;
```

**Form spacing rules:**
- Gap between label and input: 6px
- Gap between form fields: 16px-20px
- Gap between form sections: 32px
- Submit button margin-top: 24px

### Navigation

```
Nav height:         64px (mobile), 72px (desktop)
Nav horizontal pad: 16px (mobile), 24px (tablet), 32px-48px (desktop)
Nav link gap:        24px-32px between items
Nav logo size:       28px-36px height
```

### Modals and Overlays

```
Modal SM:     width: 400px;   padding: 24px;
Modal MD:     width: 560px;   padding: 32px;
Modal LG:     width: 720px;   padding: 40px;
Modal border-radius: 16px-20px
Overlay background: rgba(0, 0, 0, 0.5) with backdrop-filter: blur(4px)
```

---

## Section Spacing

### Vertical Section Rhythm

Sections need generous vertical spacing to breathe. The space between sections should be larger than any spacing within a section.

```
Mobile (< 768px):
  Section padding:    64px 16px       (top/bottom, left/right)
  Hero padding:       80px 16px
  Between sections:   No extra gap (section padding handles it)

Tablet (768px - 1199px):
  Section padding:    80px 32px
  Hero padding:       96px 32px

Desktop (1200px+):
  Section padding:    96px 48px
  Hero padding:       120px-160px 48px
```

### Internal Section Spacing

```
Section title to description:    12px-16px
Section header block to content: 32px-48px
Between content groups:          24px-32px
Between items in a group:        16px-20px
```

### Content Container Widths

```
Prose/Article:     max-width: 720px;    margin: 0 auto;
Standard page:     max-width: 1200px;   margin: 0 auto;
Wide page:         max-width: 1400px;   margin: 0 auto;
Full-bleed:        width: 100%;
```

---

## Responsive Spacing

### Scaling Strategy

Spacing reduces proportionally at smaller breakpoints, but not linearly. Section spacing reduces by ~30-40%, while component spacing reduces by ~20-25%.

| Token      | Mobile  | Tablet  | Desktop |
|-----------|---------|---------|---------|
| Section   | 64px    | 80px    | 96px    |
| Hero      | 80px    | 96px    | 128px+  |
| Component | 16px    | 20px    | 24px    |
| Card pad  | 16px    | 20px    | 24px    |
| Grid gap  | 16px    | 20px    | 24px    |
| Nav pad   | 16px    | 24px    | 48px    |

### Touch Target Sizing

Mobile interactive elements must meet minimum 44x44px touch target (Apple HIG) or 48x48px (Material Design).

- Buttons: minimum height 44px on mobile
- Links in lists: minimum 44px row height
- Icon buttons: minimum 44x44px tap area (even if icon is smaller, use padding)

---

## CSS Implementation

### CSS Variables Setup

```css
:root {
  /* Spacing scale */
  --space-0: 0;
  --space-0-5: 0.125rem;  /* 2px */
  --space-1: 0.25rem;     /* 4px */
  --space-2: 0.5rem;      /* 8px */
  --space-3: 0.75rem;     /* 12px */
  --space-4: 1rem;        /* 16px */
  --space-5: 1.25rem;     /* 20px */
  --space-6: 1.5rem;      /* 24px */
  --space-8: 2rem;        /* 32px */
  --space-10: 2.5rem;     /* 40px */
  --space-12: 3rem;       /* 48px */
  --space-16: 4rem;       /* 64px */
  --space-20: 5rem;       /* 80px */
  --space-24: 6rem;       /* 96px */
  --space-32: 8rem;       /* 128px */
  --space-40: 10rem;      /* 160px */

  /* Component sizing */
  --size-btn-sm: 32px;
  --size-btn-md: 40px;
  --size-btn-lg: 48px;
  --size-input: 40px;
  --size-nav: 64px;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-full: 999px;

  /* Content widths */
  --width-prose: 65ch;
  --width-content: 720px;
  --width-page: 1200px;
  --width-wide: 1400px;
}
```

### Utility Pattern

```css
/* Section container */
.section {
  padding: var(--space-16) var(--space-4);
}

@media (min-width: 768px) {
  .section {
    padding: var(--space-20) var(--space-8);
  }
}

@media (min-width: 1200px) {
  .section {
    padding: var(--space-24) var(--space-12);
  }
}

/* Container */
.container {
  width: 100%;
  max-width: var(--width-page);
  margin: 0 auto;
  padding: 0 var(--space-4);
}
```
