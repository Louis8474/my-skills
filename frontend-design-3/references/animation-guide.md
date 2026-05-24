# Animation Guide Reference

Detailed animation and motion specification for the frontend-design skill. Read this when you need specific animation code patterns for CSS, GSAP, or Motion (Framer Motion).

## Table of Contents
1. [CSS-Only Animations](#css-only-animations)
2. [Motion / Framer Motion Patterns](#motion--framer-motion-patterns)
3. [GSAP Patterns](#gsap-patterns)
4. [Performance Guidelines](#performance-guidelines)
5. [Animation Decision Matrix](#animation-decision-matrix)

---

## CSS-Only Animations

Use CSS animations as the default. They are performant, require no libraries, and work everywhere.

### Fade-In on Load

```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}

/* Staggered children */
.animate-in:nth-child(1) { animation-delay: 0s; }
.animate-in:nth-child(2) { animation-delay: 0.08s; }
.animate-in:nth-child(3) { animation-delay: 0.16s; }
.animate-in:nth-child(4) { animation-delay: 0.24s; }
```

### Scroll-Triggered Reveal (No JS)

```css
/* Modern CSS scroll-driven animation */
@keyframes reveal {
  from {
    opacity: 0;
    filter: blur(4px);
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
}

.scroll-reveal {
  animation: reveal linear both;
  animation-timeline: view();
  animation-range: entry 0% entry 30%;
}
```

### Scroll-Triggered Reveal (IntersectionObserver)

```javascript
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll('.scroll-reveal').forEach((el) => {
  observer.observe(el);
});
```

```css
.scroll-reveal {
  opacity: 0;
  filter: blur(2px);
  transform: translateY(20px);
  transition: opacity 0.6s ease, filter 0.6s ease, transform 0.6s ease;
}

.scroll-reveal.visible {
  opacity: 1;
  filter: blur(0);
  transform: translateY(0);
}
```

### Hover Effects

```css
/* Scale + shadow elevation */
.card-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

/* Glow effect */
.glow-hover {
  transition: box-shadow 0.3s ease;
}

.glow-hover:hover {
  box-shadow: 0 0 20px rgba(var(--accent-rgb), 0.4),
              0 0 40px rgba(var(--accent-rgb), 0.2);
}

/* Background fill */
.fill-hover {
  position: relative;
  overflow: hidden;
}

.fill-hover::before {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--color-accent);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: -1;
}

.fill-hover:hover::before {
  transform: scaleX(1);
}
```

### Continuous Marquee

```css
.marquee {
  overflow: hidden;
  white-space: nowrap;
}

.marquee-content {
  display: inline-flex;
  animation: marquee 30s linear infinite;
}

@keyframes marquee {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

/* Duplicate content for seamless loop */
```

### Gradient Background Animation

```css
.animated-gradient {
  background: linear-gradient(
    135deg,
    var(--color-primary),
    var(--color-accent),
    var(--color-secondary),
    var(--color-primary)
  );
  background-size: 300% 300%;
  animation: gradientShift 8s ease infinite;
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
```

---

## Motion / Framer Motion Patterns

Use Motion (previously Framer Motion) for React projects needing spring physics, gestures, layout animations, or exit animations.

### Basic Animate In

```jsx
import { motion } from "motion/react";

function FadeInSection({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
```

### Scroll-Triggered Reveal

```jsx
import { motion } from "motion/react";

function ScrollReveal({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.16, 1, 0.3, 1]
      }}
    >
      {children}
    </motion.div>
  );
}
```

### Staggered Children

```jsx
import { motion } from "motion/react";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function StaggerGrid({ items }) {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {items.map((i) => (
        <motion.div key={i.id} variants={item}>
          {i.content}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### Exit Animation

```jsx
import { AnimatePresence, motion } from "motion/react";

function Modal({ isOpen, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### Gesture Interactions

```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  Click me
</motion.button>
```

### Layout Animation

```jsx
<motion.div layout transition={{ type: "spring", damping: 20 }}>
  {/* Content that changes size/position smoothly */}
</motion.div>
```

---

## GSAP Patterns

Use GSAP for complex scroll-driven sequences, SVG animation, text splitting, cross-framework projects, or when you need fine-grained timeline control.

### ScrollTrigger Reveal

```javascript
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Reveal sections on scroll
gsap.utils.toArray(".section").forEach((section) => {
  gsap.from(section, {
    opacity: 0,
    y: 40,
    duration: 0.8,
    ease: "power3.out",
    scrollTrigger: {
      trigger: section,
      start: "top 85%",
      end: "top 50%",
      toggleActions: "play none none none",
    },
  });
});
```

### SplitText Animation

```javascript
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(SplitText);

const split = new SplitText(".hero-title", { type: "chars,words" });

gsap.from(split.chars, {
  opacity: 0,
  y: 20,
  rotateX: -90,
  stagger: 0.02,
  duration: 0.6,
  ease: "back.out(1.7)",
});
```

### Timeline Sequence

```javascript
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: ".hero",
    start: "top center",
  },
});

tl.from(".hero-tag", { opacity: 0, y: 20, duration: 0.4 })
  .from(".hero-title", { opacity: 0, y: 30, duration: 0.6 }, "-=0.2")
  .from(".hero-subtitle", { opacity: 0, y: 20, duration: 0.4 }, "-=0.3")
  .from(".hero-cta", { opacity: 0, y: 20, duration: 0.4 }, "-=0.2")
  .from(".hero-image", { opacity: 0, scale: 0.95, duration: 0.8 }, "-=0.3");
```

### Parallax Scrolling

```javascript
gsap.to(".parallax-bg", {
  yPercent: -30,
  ease: "none",
  scrollTrigger: {
    trigger: ".parallax-section",
    start: "top bottom",
    end: "bottom top",
    scrub: 1,
  },
});
```

### Pin Section During Scroll

```javascript
gsap.to(".pinned-content", {
  scrollTrigger: {
    trigger: ".pinned-section",
    start: "top top",
    end: "+=200%",
    pin: true,
    scrub: 1,
  },
});
```

---

## Performance Guidelines

### GPU-Accelerated Properties

Only animate properties that trigger compositing, not layout or paint:

**Safe to animate (GPU-accelerated):**
- `transform` (translate, scale, rotate)
- `opacity`
- `filter` (blur, brightness)

**Avoid animating:**
- `width`, `height` (triggers layout)
- `margin`, `padding` (triggers layout)
- `top`, `left`, `right`, `bottom` (triggers layout)
- `background-color` (triggers paint)
- `border` (triggers paint + layout)

### will-change Hint

```css
/* Apply only during animation, remove after */
.animating {
  will-change: transform, opacity;
}
```

Do not apply `will-change` to many elements simultaneously - it consumes GPU memory.

### Reduced Motion

Always respect user preferences:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```jsx
// Motion/Framer Motion
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

<motion.div
  initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
/>
```

### Frame Rate Targets

- Aim for 60fps for all animations
- Use `requestAnimationFrame` for JS-based animations
- Throttle scroll event listeners
- Use `transform: translateZ(0)` or `transform: translate3d(0,0,0)` to force GPU layer if needed

---

## Animation Decision Matrix

| Need | Solution | Library |
|------|----------|---------|
| Simple hover/focus effects | CSS transitions | None |
| Fade-in on load | CSS keyframes + animation-delay | None |
| Scroll reveal (simple) | IntersectionObserver + CSS | None (vanilla JS) |
| Scroll reveal (modern) | CSS scroll-driven animations | None |
| Spring physics | Motion `type: "spring"` | Motion |
| Exit animations | `AnimatePresence` | Motion |
| Gesture (hover, tap, drag) | `whileHover`, `whileTap`, `drag` | Motion |
| Layout animations | `layout` prop | Motion |
| Complex scroll sequences | ScrollTrigger | GSAP |
| Text split/reveal | SplitText | GSAP |
| SVG morphing | MorphSVG | GSAP |
| Timeline orchestration | gsap.timeline() | GSAP |
| Parallax scrolling | scrub: true | GSAP |
| Pin during scroll | pin: true | GSAP |
| Continuous marquee | CSS keyframes (infinite) | None |
| Gradient animation | CSS keyframes (infinite) | None |
| 3D transforms | Three.js / React Three Fiber | Three.js |

### Easing Reference

```
CSS:     cubic-bezier(0.16, 1, 0.3, 1)    /* Natural deceleration */
CSS:     cubic-bezier(0.33, 1, 0.68, 1)    /* Ease-out-cubic */
CSS:     cubic-bezier(0.22, 1, 0.36, 1)    /* Ease-out-quint */
GSAP:    "power3.out"                       /* Strong deceleration */
GSAP:    "power2.inOut"                     /* Symmetric ease */
GSAP:    "back.out(1.7)"                    /* Overshoot bounce */
GSAP:    "elastic.out(1, 0.3)"             /* Elastic spring */
Motion:  { type: "spring", damping: 25, stiffness: 300 }  /* Snappy spring */
Motion:  { type: "spring", damping: 20, stiffness: 100 }  /* Gentle spring */
Motion:  [0.16, 1, 0.3, 1]                /* Custom bezier */
```

### Timing Quick Reference

| Context | Duration | Easing |
|---------|----------|--------|
| Button hover | 0.15-0.2s | ease |
| Tooltip appear | 0.15s | ease-out |
| Dropdown open | 0.2-0.3s | ease-out |
| Modal open | 0.3s | spring (snappy) |
| Page transition | 0.4-0.5s | ease-out-quint |
| Scroll reveal | 0.6s | power3.out |
| Hero load sequence | 0.6-1.2s total | staggered |
| Gradient loop | 6-10s | linear |
| Marquee scroll | 20-40s | linear |
