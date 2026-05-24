# Component Libraries Reference

Detailed reference for UI component libraries recommended by the frontend-design skill. Read this when selecting components for React/Next.js projects or when you need specific installation and usage patterns.

## Table of Contents
1. [shadcn/ui](#shadcnui)
2. [21st.dev](#21stdev)
3. [Aceternity UI](#aceternity-ui)
4. [Three.js and 3D Assets](#threejs-and-3d-assets)
5. [Icon Libraries](#icon-libraries)
6. [Selection Guide](#selection-guide)

---

## shadcn/ui

**Purpose:** Foundation design system - accessible, customizable, open source components.
**Install:** Individual components, not the whole library.
**Stack:** React, Tailwind CSS, Radix UI primitives.

### Setup

```bash
# Initialize shadcn in your project
npx shadcn@latest init

# Add individual components
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add input
npx shadcn@latest add tabs
npx shadcn@latest add toast
```

### Key Components

| Component | Use Case |
|-----------|----------|
| Button | Primary CTAs, secondary actions, icon buttons |
| Card | Feature cards, pricing tiers, testimonials |
| Dialog | Modals, confirmations, forms |
| Sheet | Side panels, mobile navigation trays |
| Tabs | Content switching, pricing toggles |
| Accordion | FAQ sections, collapsible content |
| Badge | Status indicators, tags, labels |
| Avatar | User profiles, team sections |
| Carousel | Testimonials, image galleries |
| Command | Search interfaces, command palettes |
| Popover | Tooltips, dropdown menus |
| Separator | Visual dividers between sections |
| Skeleton | Loading states |
| Toast | Notifications, alerts |

### Customization

Override the default theme in `components.json` and `tailwind.config.js`:

```json
{
  "style": "default",
  "tailwind": {
    "baseColor": "neutral",
    "cssVariables": true
  }
}
```

Configure colors in your CSS:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 3.9%;
  --primary: 220 70% 50%;
  --primary-foreground: 0 0% 98%;
  --muted: 0 0% 96.1%;
  --accent: 280 70% 55%;
  --border: 0 0% 89.8%;
  --radius: 0.5rem;
}

.dark {
  --background: 220 15% 8%;
  --foreground: 0 0% 95%;
  --primary: 220 70% 60%;
  --muted: 220 10% 15%;
  --border: 220 10% 18%;
}
```

---

## 21st.dev

**Purpose:** Community-built components on top of shadcn - premium, animated, ready to copy.
**Stack:** React, Tailwind CSS, shadcn/ui base.
**Integration:** Works with Claude Code and Codex.

### Component Categories

| Category | Examples |
|----------|----------|
| Heros | Animated hero sections with gradients, particles, 3D |
| Features | Bento grids, feature cards with hover effects |
| CTAs | Conversion sections with animated backgrounds |
| Buttons | Glow buttons, magnetic buttons, shimmer buttons |
| Testimonials | Marquee reviews, card carousels |
| Pricing | Comparison tables, toggle cards |
| Text | Typewriter effects, gradient text, split text |
| Shaders | WebGL backgrounds, noise patterns |
| Backgrounds | Animated gradients, particle fields, aurora effects |
| Footers | Multi-column, minimal, social-focused |

### Usage Pattern

1. Browse components at [21st.dev/community/components](https://21st.dev/community/components)
2. Find a component that matches your section spec
3. Copy the component code
4. Adapt colors, fonts, and content to your style guide
5. If dependencies are needed, use the provided install prompt

### Best Practices

- Use 21st.dev components as starting templates, not final output
- Always adapt to your project's color system and typography
- Check that dependencies don't conflict with existing packages
- Combine components - use a 21st.dev hero with custom-built feature cards

---

## Aceternity UI

**Purpose:** 200+ production-ready animated components. Strong on visual effects and micro-interactions.
**Stack:** React, Next.js, Tailwind CSS, Framer Motion.
**Install:** Copy-paste from [ui.aceternity.com/components](https://ui.aceternity.com/components).

### Notable Components

| Component | Description |
|-----------|-------------|
| BackgroundBeams | Animated beam lines as section backdrop |
| Spotlight | Cursor-following spotlight effect |
| TextGenerateEffect | Character-by-character text reveal |
| HeroParallax | Parallax scrolling hero with floating cards |
| InfiniteMovingCards | Auto-scrolling testimonial or logo strip |
| BentoGrid | Asymmetric grid layout with animations |
| CardHoverEffect | 3D tilt effect with spotlight on hover |
| LampEffect | Radial glow emanating from top of section |
| TracingBeam | Scroll-progress tracing line along sidebar |
| Meteors | Animated meteor shower background |
| MovingBorder | Animated border gradient on cards |
| FloatingDock | macOS-style floating navigation dock |

### Installation Pattern

Most Aceternity components require:
```bash
npm install framer-motion clsx tailwind-merge
```

Then copy the component code and its utility functions into your project.

### Best Practices

- These components are effect-heavy - use 1-2 per page, not more
- Performance-test on lower-end devices
- Combine with shadcn for form elements and standard UI
- Always add `prefers-reduced-motion` fallbacks

---

## Three.js and 3D Assets

**Purpose:** Interactive 3D elements for hero sections and visual flair.

### React Three Fiber Setup

```bash
npm install three @react-three/fiber @react-three/drei
```

```jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

function Model({ url }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

function Hero3D() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} />
      <Model url="/models/product.glb" />
      <OrbitControls enableZoom={false} autoRotate />
    </Canvas>
  );
}
```

### 3D Model Sources

| Source | Type | License |
|--------|------|---------|
| [Sketchfab](https://sketchfab.com) | Community 3D models | Varies (check per model) |
| [Three.js Examples](https://threejs.org/examples/) | Code examples | MIT |
| [Poly Haven](https://polyhaven.com) | HDRIs, textures, models | CC0 |
| [Spline](https://spline.design) | Interactive 3D scenes | Depends on plan |
| [Ready Player Me](https://readyplayer.me) | Avatar models | Free tier available |

### Performance Tips

- Keep polygon count under 100k for web
- Use DRACO compression for .glb files
- Lazy-load 3D Canvas (below the fold or on interaction)
- Provide a static fallback image for low-power devices
- Set `frameloop="demand"` on Canvas if the scene is static

---

## Icon Libraries

### Recommended Libraries

| Library | Style | Install | Notes |
|---------|-------|---------|-------|
| Lucide | Clean line icons | `npm i lucide-react` | shadcn default, 1400+ icons |
| Phosphor | Flexible weights | `npm i @phosphor-icons/react` | 6 weights (thin to bold), 1200+ icons |
| Heroicons | Outline / Solid | `npm i @heroicons/react` | By makers of Tailwind, 300+ icons |
| Tabler Icons | Line icons | `npm i @tabler/icons-react` | 5000+ icons, consistent 24px grid |
| Radix Icons | Minimal | `npm i @radix-ui/react-icons` | Small set, pairs with Radix UI |

### Icon Usage Rules

- Use **one** icon library per project for visual consistency
- Match icon weight to typography weight (light text = thin icons, bold text = regular icons)
- Standard sizes: 16px (inline), 20px (buttons), 24px (standalone), 32px+ (feature icons)
- Always include `aria-label` for accessibility
- Use `currentColor` for fill so icons inherit text color

---

## Selection Guide

| Project Type | Primary Library | Animation | 3D |
|-------------|----------------|-----------|-----|
| SaaS Landing Page | shadcn/ui + 21st.dev | Motion | Optional (Spline/Three.js) |
| Dashboard / App | shadcn/ui | CSS transitions | No |
| Portfolio / Creative | Aceternity UI | GSAP | Optional |
| E-commerce | shadcn/ui | CSS + Motion | Product viewer (Three.js) |
| Documentation | shadcn/ui | CSS only | No |
| Marketing Site | 21st.dev + Aceternity | GSAP + Motion | Hero only |

### Decision Framework

1. **Need accessible, production-grade components?** -> shadcn/ui
2. **Need pre-built animated sections?** -> 21st.dev or Aceternity UI
3. **Need 3D elements?** -> Three.js + React Three Fiber
4. **Building a dashboard?** -> shadcn/ui only (skip animation libraries)
5. **Need maximum visual impact?** -> Aceternity UI + GSAP
