---
name: frontend-design
description: Create distinctive, production-grade frontend interfaces with high design quality using structured SOPs and comprehensive UI/UX guidelines. Use this skill when the user asks to build web components, pages, artifacts, posters, or applications (examples include websites, landing pages, dashboards, React components, HTML/CSS layouts, or when styling/beautifying any web UI). Also use when the user asks about typography, padding, spacing, sizing, layout systems, font pairing, color palettes, animation/motion design, responsive design, or UI component patterns. Generates creative, polished code and UI design that avoids generic AI aesthetics. Trigger this skill for any frontend design, UI/UX design, web design, component creation, or design system task.
---

This skill guides creation of distinctive, production-grade frontend interfaces. It provides structured SOPs, design systems, and comprehensive guidelines to produce premium results - not generic "AI slop." Implement real working code with exceptional attention to aesthetic details and creative choices.

The user provides frontend requirements: a component, page, application, or interface to build. They may include context about the purpose, audience, or technical constraints.

## Design Process SOP: Define -> Build -> Review -> Refine

Follow this structured process for any non-trivial frontend project. This mirrors how real product design teams work and produces dramatically better results than jumping straight to code.

### Phase 1: Define

Before writing any code, establish clear context and direction.

**1. Project Brief** - Understand the fundamentals:
- What are we building? (landing page, dashboard, SaaS app, portfolio)
- Who is the target audience? (developers, executives, consumers, creators)
- What is the primary goal? (conversions, engagement, information, trust)
- What are the technical constraints? (framework, performance, accessibility)
- What is the brand personality? (luxury, playful, technical, organic)

**2. Content Per Section** - Define content before design:
- List every section the page needs (hero, features, testimonials, pricing, FAQ, footer)
- Write the actual text content for each section in separate specs
- Include: headings, subheadings, body copy, CTAs, metadata
- This prevents placeholder-driven design which always looks generic

**3. Mood Board and Aesthetic Direction** - Commit to a BOLD direction:
- Pick a clear aesthetic: brutally minimal, maximalist chaos, retro-futuristic, organic/natural, luxury/refined, playful/toy-like, editorial/magazine, brutalist/raw, art deco/geometric, soft/pastel, industrial/utilitarian
- Note specific things you like: layout patterns, typography choices, color treatments, animation styles, component shapes
- Every design decision should trace back to the aesthetic direction

**4. Style Guide** (living document) - Create a single source of truth:
- Color palette with usage rules (primary, secondary, accent, semantic)
- Typography scale with font pairing rationale
- Spacing system with component and section rules
- Component specifications (button styles, card treatments, input patterns)
- Animation principles and timing standards
- This document evolves as you build - update it when you learn something new

### Phase 2: Build

Build section by section with isolated context.

- Start each section referencing only its spec and the style guide
- Commit after completing each section (enables safe rollback)
- Build in order: global styles -> navigation -> hero -> content sections -> footer
- Each section gets its own focused prompt with specific requirements

### Phase 3: Review

After building each section:
- Check against the style guide for consistency
- Verify responsive behavior at all breakpoints
- Test animations and interactions
- Compare against the mood board aesthetic direction

### Phase 4: Refine

Based on review findings:
- Update the style guide if design decisions changed
- Apply fixes to the current section
- Document learnings for future sections
- This loop continues until the section matches the vision

---

## Typography System

Typography is the single most impactful design decision. It sets the entire tone.

### Font Selection Principles

Choose fonts that are beautiful, unique, and characterful. Pair a distinctive display font with a refined body font.

**Display Font Categories** (for headings, hero text, statements):
- Geometric Sans: Outfit, Plus Jakarta Sans, Satoshi, General Sans
- Humanist Sans: Source Sans 3, Libre Franklin
- Neo-Grotesque: Switzer, Neue Montreal (paid)
- Serif Display: Playfair Display, Fraunces, Instrument Serif
- Slab Serif: Zilla Slab, Roboto Slab
- Monospace Display: JetBrains Mono, Space Mono, Fira Code
- Variable/Experimental: Clash Display, Cabinet Grotesk

**Body Font Categories** (for paragraphs, UI text, labels):
- Clean Sans: DM Sans, Nunito Sans, Work Sans, Manrope
- Readable Serif: Source Serif 4, Lora, Crimson Pro
- System-feel: Inter (only as body, never as display), Geist Sans

**Font Pairing Rules:**
- Contrast in style (serif display + sans body, or geometric + humanist)
- Match x-height proportions for visual harmony
- Limit to 2 fonts maximum (3 if using a monospace accent)
- The display font carries personality; the body font carries readability

### Type Scale

Use a consistent modular scale. Recommended: **Major Third (1.250)** for most projects.

```
--text-xs:    0.75rem   (12px)  - Captions, labels, metadata
--text-sm:    0.875rem  (14px)  - Small body, secondary text
--text-base:  1rem      (16px)  - Body text baseline
--text-lg:    1.125rem  (18px)  - Lead paragraphs, emphasis
--text-xl:    1.25rem   (20px)  - Section intros
--text-2xl:   1.5rem    (24px)  - H4, card titles
--text-3xl:   1.875rem  (30px)  - H3, section headers
--text-4xl:   2.25rem   (36px)  - H2, major sections
--text-5xl:   3rem      (48px)  - H1, page titles
--text-6xl:   3.75rem   (60px)  - Hero headlines
--text-7xl:   4.5rem    (72px)  - Display, statement text
```

### Line Height and Spacing

```
Headings:     line-height: 1.1 - 1.2  (tight, creates visual weight)
Body:         line-height: 1.5 - 1.7  (comfortable reading)
UI elements:  line-height: 1.3 - 1.4  (compact but readable)
```

**Letter Spacing:**
- Headings: -0.02em to -0.04em (tight - creates premium feel)
- Body: 0 to 0.01em (natural)
- All-caps text: 0.05em to 0.1em (wide - prevents letters from crowding)

**Font Weights:**
- 300 (Light): Elegant headings, minimal aesthetic
- 400 (Regular): Body text default
- 500 (Medium): UI labels, subtle emphasis
- 600 (Semi-bold): Subheadings, buttons
- 700 (Bold): Strong headings, CTAs

**Responsive Scaling:** Reduce heading sizes by ~20-30% on mobile. Use CSS clamp() for fluid scaling:
```css
font-size: clamp(2rem, 5vw, 3.75rem);
```

For the full typography reference including font specimen examples, read `references/typography-scale.md`.

---

## Spacing and Sizing System

Use a consistent spacing system based on an **8px grid** with a 4px half-step for fine adjustments. Consistent spacing is what separates premium from amateur.

### Spacing Scale

```
--space-1:    4px    (0.25rem)  - Tight gaps, icon padding
--space-2:    8px    (0.5rem)   - Inline spacing, small gaps
--space-3:    12px   (0.75rem)  - Form element padding
--space-4:    16px   (1rem)     - Standard padding, paragraph gaps
--space-5:    20px   (1.25rem)  - Card padding (small)
--space-6:    24px   (1.5rem)   - Card padding, section gaps
--space-8:    32px   (2rem)     - Component separation
--space-10:   40px   (2.5rem)   - Section internal padding
--space-12:   48px   (3rem)     - Major component gaps
--space-16:   64px   (4rem)     - Section spacing (mobile)
--space-20:   80px   (5rem)     - Section spacing (tablet)
--space-24:   96px   (6rem)     - Section spacing (desktop)
--space-32:   128px  (8rem)     - Hero/major section spacing
```

### Component Sizing Standards

| Component    | Height   | Padding (h x v)    | Border Radius |
|-------------|----------|-------------------|---------------|
| Button SM   | 32px     | 12px x 6px        | 6px           |
| Button MD   | 40px     | 16px x 8px        | 8px           |
| Button LG   | 48px     | 24px x 12px       | 10px          |
| Input       | 40-44px  | 12px x 10px       | 8px           |
| Card        | auto     | 24px - 32px       | 12px - 16px   |
| Badge       | 24-28px  | 8px x 4px         | 999px (pill)  |
| Avatar SM   | 32px     | -                 | 50%           |
| Avatar LG   | 48px     | -                 | 50%           |
| Nav height  | 64-72px  | 16px-24px lateral | -             |

### Content Width Standards

```
--max-width-prose:     65ch     (optimal reading line length)
--max-width-content:   720px    (article/blog content)
--max-width-page:      1200px   (standard page container)
--max-width-wide:      1400px   (wide layouts, dashboards)
--max-width-full:      100%     (edge-to-edge sections)
```

For the full spacing reference including responsive adjustments, read `references/spacing-system.md`.

---

## Layout System

### Visual Hierarchy Principles

Every layout should establish clear visual hierarchy through four tools:
1. **Contrast** - The strongest element gets the most contrast against the background
2. **Size** - Larger elements are read first
3. **Color** - Saturated or bright elements draw the eye before muted ones
4. **Whitespace** - Elements with more space around them feel more important

Apply variation to avoid monotony - alternate between text-heavy and visual sections, left-aligned and centered content, dense and spacious areas.

### Grid Patterns

| Columns | Use Case | Notes |
|---------|----------|-------|
| 1       | Hero, CTA, statement sections | Full-width impact, centered or asymmetric |
| 2       | Feature highlights, text+media | Most versatile; image+text or side-by-side |
| 3       | Feature cards, pricing tiers | Classic for equal-weight items |
| 4       | Feature grids, dashboards | Dense but organized; reduce to 2 on mobile |
| 5       | Logo bars, icon rows | Slim items only; reduce to 3 on mobile |

### Layout Patterns

**Bento Box** - Mixed-size cards in an asymmetric grid. Create visual interest through 2:1 and 1:1 ratio combinations. Excellent for feature showcases.

**Card Grid** - Equal-size cards in a regular grid. Best for items with similar content structure (team members, pricing plans, blog posts). Use gap of 16-24px between cards.

**Accordion** - Vertically stacked expandable sections. Use for FAQ, feature details, documentation. Avoid in hero sections.

**Split Screen** - 50/50 or 60/40 vertical divide. Strong for product+description, image+form pairings.

### Section Composition (Conversion Blueprint)

Build landing pages using this proven section flow:
1. **Hero** - Hook statement + value proposition + primary CTA + supporting visual
2. **Social Proof** - Trust logos, "featured in" marquee, user counts
3. **Features** - 3-4 key features in cards or bento layout
4. **How It Works** - 3-step process with numbered cards
5. **Testimonials** - Scrolling carousel with results/metrics
6. **Pricing** - Tiered cards with recommended badge
7. **FAQ** - Accordion with 5-8 questions
8. **CTA** - Final conversion section with urgency
9. **Footer** - Links, legal, social

### Responsive Design Rules

- **Desktop** (1200px+): Full grid layouts
- **Tablet** (768-1199px): Reduce columns by 1-2, increase section padding
- **Mobile** (< 768px): Single column, stack everything, hamburger nav with animated tray
- Column reduction: 5->3, 4->2, 3->2 or 1, 2->1
- Navigation: Collapse to burger menu from tablet breakpoint down

For the full layout reference including detailed examples, read `references/layout-patterns.md`.

---

## Color System

### Color Theory for UI

- **Blue** - Trust, professionalism, security (finance, enterprise, security products)
- **Teal/Cyan** - Modern, digital, innovation (tech startups, SaaS)
- **Green** - Growth, health, success (sustainability, health, finance)
- **Orange/Amber** - Energy, urgency, warmth (food, fitness, e-commerce)
- **Purple** - Creativity, luxury, wisdom (creative tools, premium products)
- **Red** - Urgency, passion, power (sales, entertainment, food)

### Palette Construction

Use HSL for precise control. Build palettes with:
- **1 Primary** color (60% usage) - brand identity, main actions
- **1 Secondary** color (optional, 25%) - supporting elements
- **1 Accent** color (10%) - highlights, badges, alerts
- **Neutral scale** (5% + backgrounds) - 8-10 shades from near-white to near-black

**Dark Theme Specifics:**
- Background: hsl(220, 15%, 8-12%) - not pure black
- Surface: 2-4% lighter than background
- Text: hsl(0, 0%, 85-95%) - not pure white (reduces strain)
- Borders: hsl(0, 0%, 15-20%) with low opacity

**Body Text Opacity:** Use 60-80% opacity for non-heading text. This creates natural hierarchy without extra color values.

---

## Animation and Motion

Animations should feel purposeful - they guide attention, provide feedback, and create delight. Every animation needs a reason to exist.

### Priority Order

1. **CSS-only first** - transitions, keyframes, scroll-driven animations
2. **Motion (Framer Motion)** - when you need spring physics, gestures, layout animations, exit animations, or React integration
3. **GSAP** - when you need ScrollTrigger, SplitText, SVG morphing, complex timelines, or cross-framework support

### Key Animation Patterns

**Page Load** - Stagger content in with opacity (0->1) and translateY (20px->0). Use 0.4-0.6s duration with 0.08-0.12s stagger between elements. This single pattern creates more premium feel than scattered micro-interactions.

**Scroll Reveal** - Animate sections as they enter the viewport with opacity + slight blur (2px->0). Use IntersectionObserver or ScrollTrigger. Trigger at 15-20% visibility.

**Hover States** - Scale (1.02-1.05), shadow elevation, color shift, or subtle glow. Keep under 0.2s. Every interactive element needs a hover state.

**Sticky Navigation** - Add backdrop-filter: blur(12px) + reduced opacity background on scroll.

### Timing Standards

```
--duration-instant:  100ms   (hover color changes, toggles)
--duration-fast:     200ms   (button states, tooltips)
--duration-normal:   300ms   (panels, dropdowns, modals)
--duration-slow:     500ms   (page transitions, reveals)
--duration-slower:   800ms   (complex sequences, hero animations)
```

**Easing:** Use `cubic-bezier(0.16, 1, 0.3, 1)` for natural deceleration. Avoid linear easing for UI elements.

For the full animation reference including GSAP and Motion code patterns, read `references/animation-guide.md`.

---

## Component Libraries and Resources

When building React/Next.js projects, use these component libraries for premium results:

**shadcn/ui** - Foundation design system. Customizable, accessible, open source. Install components individually - do not import the entire library. Configure with your design tokens.

**21st.dev** - Community components built on shadcn. Categories: Heros, Features, CTAs, Buttons, Testimonials, Pricing, Shaders, Text. Copy component code and adapt to your style guide.

**Aceternity UI** - 200+ production-ready components with Tailwind CSS and Framer Motion animations baked in. Excellent for animated backgrounds, text effects, card interactions.

**Three.js / Sketchfab** - For 3D elements. Use Three.js to render interactive 3D models. Source models from Sketchfab. Embed with React Three Fiber for React projects.

**Icon Libraries:** Prefer Phosphor Icons (light weight, clean) or Lucide Icons (shadcn default). Use consistent weight throughout.

For detailed setup instructions, component catalogs, and a selection guide by project type, read `references/component-libraries.md`.
For design inspiration sources, color/typography/gradient tools, and accessibility checkers, read `references/design-resources.md`.

---

## Premium Design Patterns

These patterns transform generic designs into premium ones:

- **Glassmorphism** - Semi-transparent backgrounds with backdrop-filter: blur(12-20px), subtle border (1px white at 10-15% opacity), slight background tint. Use for cards, modals, navigation.
- **Neumorphism** - Soft shadow-based 3D effect. Use sparingly for buttons or toggle controls. Needs careful light/shadow balance.
- **Gradient Meshes** - Organic, multi-color gradients as section backgrounds. Create depth and atmosphere.
- **Noise/Grain Overlays** - Subtle noise texture (2-5% opacity) over solid backgrounds to add tactile quality.
- **Depth Layers** - Overlapping elements at different z-levels. Use subtle parallax on scroll.
- **Animated Backgrounds** - Particle fields, gradient animations, shader effects. Use for hero sections. Keep performance in mind.
- **Marquee/Scroll Tickers** - Auto-scrolling logo bars, testimonial strips. Continuous CSS animation.

---

## Bundled Scripts

Two utility scripts are available to accelerate setup:

**`scripts/generate_design_system.py`** - Generates a complete CSS custom properties file with design tokens. Supports 6 presets (saas-dark, saas-light, portfolio-dark, portfolio-light, editorial, minimal) and CLI overrides for colors, fonts, and theme. Run at project start to scaffold your design tokens file.

```bash
python scripts/generate_design_system.py --preset saas-dark --output design-tokens.css
python scripts/generate_design_system.py --primary "220, 70%, 50%" --font-display "Outfit" --theme dark -o tokens.css
```

**`scripts/scaffold_section.py`** - Generates HTML/CSS scaffold for common landing page sections. Supports: hero (centered, split, fullscreen), features (grid, bento, alternating), pricing, testimonials, FAQ, CTA, footer, trust bar. Each scaffold uses the design system CSS variables.

```bash
python scripts/scaffold_section.py --section hero --style centered --output hero.html
python scripts/scaffold_section.py --list  # See all available sections and variants
```

---

## Anti-Patterns (What to Avoid)

- **Ghost buttons on dark backgrounds** - Low contrast, poor accessibility. Use solid fills or strong outlines instead.
- **Generic AI aesthetics** - Purple gradients on white, Inter font everywhere, predictable card grids. Every design should have specific character.
- **Overcrowded sections** - Trying to show everything at once. Whitespace is a feature, not wasted space.
- **Inconsistent spacing** - Mixing arbitrary pixel values. Use only the spacing scale.
- **Too many font sizes** - Stick to the type scale. If a size feels wrong, adjust the scale, do not add one-off values.
- **Weak visual hierarchy** - Every section needs a clear focal point. If everything is equally bold, nothing stands out.
- **Missing hover/active states** - Every interactive element needs visual feedback.
- **Ignoring mobile** - Design mobile-first or at minimum verify every breakpoint.

---

Match implementation complexity to the aesthetic vision. Maximalist designs need elaborate animations and effects. Minimalist designs need restraint, precision, and careful attention to spacing and typography. The key is intentional execution of the chosen direction.
