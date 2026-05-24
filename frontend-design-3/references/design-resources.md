# Design Resources Reference

Curated list of design resources, inspiration sources, and tools for the frontend-design skill. Read this when you need to find inspiration, reference designs, or recommend tools to the user.

## Table of Contents
1. [Inspiration Sources](#inspiration-sources)
2. [Color Tools](#color-tools)
3. [Typography Tools](#typography-tools)
4. [Gradient and Background Generators](#gradient-and-background-generators)
5. [CSS Tools and Generators](#css-tools-and-generators)
6. [Accessibility Tools](#accessibility-tools)

---

## Inspiration Sources

### Design Galleries

| Source | Best For | URL |
|--------|----------|-----|
| Dribbble | General UI/UX inspiration, mood boards | dribbble.com |
| Mobbin | Mobile and web UI patterns, real-world apps | mobbin.com |
| Awwwards | Award-winning web design, cutting edge | awwwards.com |
| SiteInspire | Curated web design showcase | siteinspire.com |
| Godly | Best web design, curated gallery | godly.website |
| Land-book | Landing page inspiration | land-book.com |
| Lapa Ninja | Landing page gallery with categories | lapa.ninja |
| Dark Design | Dark-themed website gallery | dark.design |
| SaaS Landing Page | SaaS-specific landing page examples | saaslandingpage.com |
| One Page Love | Single-page website showcase | onepagelove.com |

### How to Use for Mood Boards

1. Search by keyword (e.g., "security dark theme", "SaaS pricing")
2. Collect 3-5 references that match the desired aesthetic
3. For each reference, note: what you like about it (layout, typography, colors, animations)
4. Screenshot key sections for section-specific mood boards
5. Include reference URLs in section specs for context

---

## Color Tools

| Tool | Purpose | URL |
|------|---------|-----|
| Realtime Colors | Live preview colors on a real website layout | realtimecolors.com |
| Coolors | Generate and browse color palettes | coolors.co |
| Huemint | AI color palette generator for brands | huemint.com |
| ColorMagic | AI palette generator from descriptions | colormagic.app |
| oklch Color Picker | Modern oklch color space picker | oklch.com |
| Color Review | Check color contrast ratios | color.review |
| Palette Generator | Generate palettes from images | palettes.shecodes.io |
| Material Palette | Material Design color system | materialpalettes.com |

### Color Palette Workflow

1. Start with brand primary (if exists) or use color theory from SKILL.md
2. Generate supporting palette using Realtime Colors or Coolors
3. Test contrast ratios with Color Review (minimum 4.5:1 for text)
4. Export as CSS custom properties (HSL format preferred)
5. Create dark theme variant (adjust lightness values, not hues)

---

## Typography Tools

| Tool | Purpose | URL |
|------|---------|-----|
| Google Fonts | Free web fonts, 1500+ families | fonts.google.com |
| Fontshare | Free quality fonts by Indian Type Foundry | fontshare.com |
| Type Scale | Visual type scale calculator | typescale.com |
| Fontjoy | AI font pairing generator | fontjoy.com |
| Archetype | Interactive typography design tool | archetypeapp.com |
| Font Pair | Curated font pairing suggestions | fontpair.co |

### Font Loading Performance

```html
<!-- Optimal Google Fonts loading -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=FONT_NAME:wght@400;600;700&display=swap" rel="stylesheet">
```

For self-hosted (better performance):
1. Download .woff2 files from Google Fonts
2. Use `@font-face` with `font-display: swap`
3. Preload critical fonts with `<link rel="preload">`

---

## Gradient and Background Generators

| Tool | Purpose | URL |
|------|---------|-----|
| Mesh Gradient | Organic mesh gradient generator | meshgradient.in |
| CSS Gradient | Linear/radial gradient builder | cssgradient.io |
| Haikei | SVG background shape generator | haikei.app |
| SVG Backgrounds | Repeating SVG pattern backgrounds | svgbackgrounds.com |
| Pattern Monster | SVG pattern generator | pattern.monster |
| Noise & Texture | CSS noise/grain texture generator | noiseandtexture.com |
| Grainy Gradients | Grain overlay gradient tool | grainy-gradients.vercel.app |
| Glassmorphism | Glass effect CSS generator | glassmorphism.com |
| Neumorphism | Soft UI shadow generator | neumorphism.io |

### Background Implementation Patterns

**Noise Overlay:**
```css
.noise-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,...") repeat;
  opacity: 0.03;
  pointer-events: none;
}
```

**Mesh Gradient:**
```css
.mesh-bg {
  background:
    radial-gradient(at 20% 30%, hsl(220, 70%, 50%) 0%, transparent 50%),
    radial-gradient(at 80% 70%, hsl(280, 70%, 50%) 0%, transparent 50%),
    radial-gradient(at 50% 50%, hsl(200, 70%, 40%) 0%, transparent 70%);
  background-color: hsl(220, 15%, 8%);
}
```

---

## CSS Tools and Generators

| Tool | Purpose | URL |
|------|---------|-----|
| Cubic Bezier | Custom easing curve builder | cubic-bezier.com |
| Animista | CSS animation generator | animista.net |
| Shadows Brumm | Layered CSS shadow generator | shadows.brumm.af |
| CSS Grid Generator | Visual grid layout builder | cssgrid-generator.netlify.app |
| Flexbox Froggy | Learn flexbox interactively | flexboxfroggy.com |
| CSS Buttons | Button style generator | cssbuttons.app |
| Fancy Border Radius | Organic border-radius shapes | 9elements.github.io/fancy-border-radius |
| Clippy | CSS clip-path generator | bennettfeely.com/clippy |
| Keyframes | Visual animation timeline editor | keyframes.app |

### Box Shadow Layered Pattern

Single-layer shadows look flat. Layer 2-3 shadows for depth:

```css
.card-shadow {
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.07),
    0 4px 8px rgba(0, 0, 0, 0.07),
    0 12px 24px rgba(0, 0, 0, 0.1);
}

.card-shadow-dark {
  box-shadow:
    0 1px 2px rgba(0, 0, 0, 0.2),
    0 4px 8px rgba(0, 0, 0, 0.2),
    0 16px 32px rgba(0, 0, 0, 0.3);
}
```

---

## Accessibility Tools

| Tool | Purpose | URL |
|------|---------|-----|
| Wave | Web accessibility evaluator | wave.webaim.org |
| Axe DevTools | Browser extension for a11y testing | deque.com/axe |
| Contrast Checker | WCAG contrast ratio checker | webaim.org/resources/contrastchecker |
| Who Can Use | Shows how colors appear to different vision types | whocanuse.com |
| Stark | Figma/browser contrast and vision sim | getstark.co |

### Minimum Accessibility Standards

- Text contrast: 4.5:1 against background (WCAG AA)
- Large text (24px+): 3:1 contrast ratio
- Interactive elements: visible focus indicators
- Images: alt text on all meaningful images
- Buttons/links: minimum 44x44px touch target
- Animations: respect `prefers-reduced-motion`
- Forms: associated labels, error states, focus management
- Semantic HTML: proper heading hierarchy (h1 -> h2 -> h3, no skipping)
