---
name: web-animation
description: Design and implement web animations that feel natural and purposeful. Use this skill when the user asks to add motion, transitions, or interactive effects. Covers easing, spring physics, timing, orchestration, scroll-driven animations, and accessibility. Compatible with CSS, Motion (React/JS/Vue), and native Web Animations API.
license: Complete terms in LICENSE.txt
---

This skill guides creation of animations that feel intentional, polished, and delightful — never jarring or gratuitous.

Every animation decision starts with these questions:
1. **Is this element entering or exiting?** → Use `ease-out` (decelerate into resting position)
2. **Is an on-screen element moving (hover, toggle, drag)?** → Use `ease-in-out` (smooth from/to rest)
3. **Is a user-initiated feedback (button press, ripple)?** → Use spring (bouncy, responsive)
4. **Will users see this 100+ times daily?** → Don't animate it, or use imperceptibly fast animation (< 150ms)

## Core Principles

### Easing (the single most important factor)

| Type | When | Easing |
|---|---|---|
| Enter | Elements appearing | `ease-out` — decelerate into position |
| Exit | Elements leaving | `ease-in` — accelerate away (or just fade, exits need less attention) |
| Move | Elements already on screen | `ease-in-out` — smooth from/to rest |
| Spring | Gestures, bounces | Physics-based (`stiffness` + `damping`) |

Motion provides this easing function that works well for most UI animations:
```ts
const uiEase = [0.16, 1, 0.3, 1]; // ease-out with smooth tail
```

### Duration

| Element | Duration |
|---|---|
| Micro-interaction (button, toggle) | 100-200ms |
| Small element (tooltip, badge) | 150-250ms |
| Moderate (modal, drawer) | 200-400ms |
| Page transition | 300-500ms |
| Stagger (per child) | 30-80ms |

Longer durations should be paired with more pronounced easing. A 600ms `ease-out` feels slow; a 600ms spring does not.

### Spring Physics

Use springs for natural-feeling interactions. Motion API:
```tsx
transition={{ type: "spring", stiffness: 300, damping: 25 }}
```

Rules of thumb:
- **Button press**: stiffness 500+, damping 30-40 (snappy)
- **Modal enter**: stiffness 350-450, damping 25-30
- **Drawer slide**: stiffness 250-350, damping 20-25
- **Bouncy/cute**: damping < 20, mass < 1

Springs are preferable to `cubic-bezier` for:
- Gesture-driven animations (drag, swipe)
- Elements that should feel "alive" (cards snapping, toggles)
- Repeated interactions where responsiveness matters

Use `cubic-bezier` for:
- Enter/exit of many elements (better performance at scale)
- Scroll-driven animations
- Opacity/color transitions

### Stagger & Orchestration

Sequence multiple animations with intentional delays:
```tsx
// Container orchestrates children
const container = {
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0 },
};
```

Stagger timing: `0.03-0.08s` per item for subtle, `0.1-0.2s` for dramatic.

**One big moment > many small ones**: Focus animation budget on entry, state change, or the single most important interactive element. Not everything needs to animate.

### Accessibility

ALWAYS implement:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

For Motion:
```tsx
import { useReducedMotion } from "motion/react";

function Component() {
  const prefersReduced = useReducedMotion();
  const transition = prefersReduced ? { duration: 0 } : { type: "spring" };
}
```

## Technology-Specific Guidelines

### CSS Animations

- Prefer `transform` + `opacity` for GPU-accelerated properties
- `@keyframes` for multi-step sequences
- `animation-timeline: view()` for scroll-driven reveals (CSS-only!)
- `@starting-style` for enter animations on dynamically inserted elements
- `linear()` function for custom spring easing in CSS:
  ```css
  :root {
    --ease-spring: linear(
      0, 0.015, 0.055, 0.12, 0.21, 0.33, 0.465, 0.615,
      0.765, 0.905, 1.015, 1.065, 1.055, 1, 0.99, 1
    );
  }
  ```
- `will-change: transform` on animating elements (but remove after)

### Motion (React)

```tsx
import { motion, AnimatePresence } from "motion/react";

// Recommended setup
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ type: "spring", stiffness: 400, damping: 30 }}
/>
```

Key APIs:
- `motion.div` — animated component
- `AnimatePresence` — exit animations
- `useScroll()`, `useTransform()` — scroll-linked
- `useSpring()` — physics-based value interpolation
- `useDragControls` — drag gestures
- `layout` + `layoutId` — shared layout animations (FLIP)
- `variants` — reusable animation states with stagger orchestration
- `whileInView`, `whileHover`, `whileTap`, `whileFocus` — trigger variants
- `onViewportEnter`, `onViewportExit` — intersection observer

### Motion (JS standalone)

```ts
import { animate, scroll, hover, press } from "motion";

// Animate any element
animate(selector, { opacity: 1, scale: 1 }, { type: "spring" });

// Scroll-driven
scroll(animate(selector, { scale: [0.8, 1] }));
```

### Web Animations API (WAAPI)

Best for CSS-like control from JS. Prefer Motion over WAAPI for React projects.

## Performance Rules

1. **Only animate `transform` and `opacity`** — everything else triggers layout/paint
2. **GPU acceleration**: Add `will-change: transform` to animated elements (remove after animation)
3. **Avoid animating `height`/`width`** — use `transform: scale()` or max-height tricks
4. **Prefer CSS animations** over JS-driven for simple transitions
5. **Use `content-visibility: auto`** on off-screen animated elements
6. **RAIL model**: Response < 100ms, Animation < 16ms per frame, Idle, Load < 1s

## When NOT to animate

- Repeated actions (don't animate every row in a table)
- Loading states that resolve in < 200ms
- Elements the user interacts with constantly (keep it fast)
- When `prefers-reduced-motion` is set (respect it — disable or reduce to 10%)
- Information-dense views (dashboards, analytics) — keep motion functional, not decorative

## Easing Curves Reference

```css
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);        /* Smooth enter */
--ease-in-out-expo: cubic-bezier(0.87, 0, 0.13, 1);     /* Smooth move */
--ease-snappy: cubic-bezier(0.34, 1.56, 0.64, 1);       /* Bouncy */
--ease-out-quad: cubic-bezier(0.5, 1, 0.89, 1);         /* Gentle enter */
--ease-breeze: cubic-bezier(0.55, 0.085, 0.68, 0.53);   /* Wind-like */
--ease-silk: cubic-bezier(0.52, 0.062, 0.64, 0.21);     /* Smooth */
--ease-crisp: cubic-bezier(0.92, 0.06, 0.77, 0.045);    /* Sharp */
```

## Recipes

### Recipe: Animated counter
```tsx
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect } from "react";

function Counter({ from = 0, to = 100 }) {
  const count = useMotionValue(from);
  const rounded = useTransform(() => Math.round(count.get()));

  useEffect(() => {
    const controls = animate(count, to, { duration: 2, ease: "easeOut" });
    return controls.stop;
  }, [to]);

  return <motion.span>{rounded}</motion.span>;
}
```

### Recipe: Layout animation (reorder/FLIP)
```tsx
<motion.div layout transition={{ type: "spring", stiffness: 350, damping: 25 }}>
  {/* When this element moves in the DOM, Motion animates the position change */}
</motion.div>
```

### Recipe: Spring button press
```tsx
<motion.button
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.97 }}
  transition={{ type: "spring", stiffness: 500, damping: 35 }}
/>
```

### Recipe: Scroll-triggered reveal
```tsx
import { motion, useInView } from "motion/react";
import { useRef } from "react";

function FadeIn({ children, delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ type: "spring", stiffness: 300, damping: 25, delay }}
    >
      {children}
    </motion.div>
  );
}
```

### Recipe: Parallax scroll effect
```tsx
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

function ParallaxImage({ src, speed = 0.5 }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

  return (
    <div ref={ref} className="relative h-[400px] overflow-hidden">
      <motion.img src={src} style={{ y }} className="absolute inset-0 w-full h-[140%] object-cover" />
    </div>
  );
}
```

### Recipe: Text reveal (character stagger)
```tsx
import { motion } from "motion/react";

function TextReveal({ text, className }) {
  const characters = text.split("");

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.03 } },
  };

  const child = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
  };

  return (
    <motion.span variants={container} initial="hidden" whileInView="show" viewport={{ once: true }} className={className}>
      {characters.map((char, i) => (
        <motion.span key={i} variants={child} className="inline-block">
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  );
}
```

### Recipe: Magnetic button
```tsx
import { motion } from "motion/react";
import { useRef, useState } from "react";

function MagneticButton({ children, strength = 0.3 }) {
  const ref = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e) => {
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (clientX - left - width / 2) * strength;
    const y = (clientY - top - height / 2) * strength;
    setPosition({ x, y });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: "spring", stiffness: 350, damping: 15, mass: 0.5 }}
    >
      {children}
    </motion.button>
  );
}
```

### Recipe: Page transition (AnimatePresence)
```tsx
import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";

export function PageTransition({ children }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Recipe: Infinite marquee
```tsx
import { motion } from "motion/react";

function Marquee({ children, speed = 20, direction = "left" }) {
  const baseVelocity = direction === "left" ? -speed : speed;

  return (
    <div className="overflow-hidden whitespace-nowrap">
      <motion.div
        className="inline-flex gap-8"
        animate={{ x: direction === "left" ? "-50%" : "50%" }}
        transition={{
          x: {
            duration: 20,
            repeat: Infinity,
            ease: "linear",
            repeatType: "loop",
          },
        }}
      >
        {children}
        {children} {/* Duplicate for seamless loop */}
      </motion.div>
    </div>
  );
}
```

## References
- **animations.dev** — Emil Kowalski's course (spring physics, easing theory, taste)
- **Motion docs** (motion.dev/docs) — official API reference
- **Josh W. Comeau** (joshwcomeau.com) — CSS animation tutorials, "Whimsical Animations"
- **MDN: Animation Timeline** — `view-timeline`, `scroll-timeline`
