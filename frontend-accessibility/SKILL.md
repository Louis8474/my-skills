---
name: frontend-accessibility
description: Ensure every frontend interface is accessible to all users. Use this skill proactively when building components, forms, navigation, modals, tables, or any interactive UI. Covers ARIA, keyboard navigation, color contrast, screen readers, focus management, and semantic HTML.
license: Complete terms in LICENSE.txt
---

This skill ensures all frontend output meets WCAG 2.2 Level AA and works for keyboard users, screen reader users, and people with motor or visual impairments.

**Accessibility is not optional.** Every component, page, and interaction must be accessible by default. Do not treat it as a later addition.

## Core Rules

1. **Use semantic HTML first** — ARIA is a supplement, not a replacement
2. **All interactive elements must be keyboard accessible** — Tab order must be logical and visible
3. **Color is not the only way to convey information** — Add icons, text, patterns
4. **Focus must always be visible and managed** — Never hide focus indicators without replacement
5. **Test with keyboard alone** — If you can't use it with Tab, Enter, Space, Escape, and arrow keys, it's broken

---

## Semantic HTML

Prefer native elements over ARIA whenever possible:

| Don't use | Use instead |
|---|---|
| `<div role="button" onClick={...}>` | `<button>` |
| `<div role="link" onClick={...}>` | `<a href="...">` |
| `<span class="heading">` | `<h1>`–`<h6>` |
| `<div class="list">` | `<ul>`, `<ol>`, `<li>` |
| `<div onClick={toggle}>` | `<details><summary>` |
| Custom `<input>` wrapper | `<label>` + `<input>` with `htmlFor`/`id` |

### Landmark regions
Structure every page with landmarks:
```html
<header>          <!-- or role="banner" -->
<nav>             <!-- or role="navigation" -->
<main>            <!-- or role="main" -->
<aside>           <!-- or role="complementary" -->
<footer>          <!-- or role="contentinfo" -->
<section aria-labelledby="section-heading"> <!-- with heading -->
```

**One `<main>` per page. One `<h1>` per page. Heading hierarchy must not skip levels.**

---

## Keyboard Navigation

### Tab order
- Tab order must follow the visual reading order (left-to-right, top-to-bottom)
- Use `tabindex="0"` to make non-focusable elements focusable (rarely needed)
- NEVER use `tabindex` > 0 — it breaks natural order
- Use `tabindex="-1"` to programmatically focus an element without adding it to tab order

### Common keyboard patterns

| Component | Keys |
|---|---|
| Button / Link | Enter, Space |
| Checkbox | Space (toggle) |
| Radio group | Arrow keys (navigate), Space (select) |
| Select / Dropdown | Arrow keys, Enter (select), Escape (close) |
| Tabs | Arrow keys (switch), Tab (into panel) |
| Accordion | Enter/Space (toggle), Arrow keys (between items) |
| Dialog / Modal | Escape (close), Tab (trap focus) |
| Menu / Menubar | Arrow keys, Enter, Escape |
| Slider | Arrow keys, Home, End |
| Command palette | Arrow keys, Enter (select), Escape (close) |

### Focus trapping
Modal dialogs MUST trap focus. With Radix Dialog, this is automatic. For custom implementations:
```tsx
// Focus first focusable element on open
// Tab from last element → loops to first
// Shift+Tab from first → loops to last
// Escape closes modal and returns focus to trigger
```

### Skip links
Every page with navigation should have a skip link:
```html
<a href="#main" class="sr-only focus:not-sr-only">Skip to main content</a>
<main id="main">...</main>
```

### Focus indicators
Never remove default focus styles without providing better ones:
```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
/* Remove ONLY if you provide a stronger replacement */
```

---

## ARIA

### When to use ARIA
- Complex widgets not available in native HTML (tabs, tree, command palette)
- Dynamic content updates (live regions)
- Landmark labeling (`aria-label` on multiple `<nav>` elements)
- State that isn't conveyed by native attributes

### Common ARIA patterns

```tsx
// Tabs
<div role="tablist">
  <button role="tab" aria-selected="true" aria-controls="panel-1" id="tab-1">Tab 1</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2" id="tab-2">Tab 2</button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">...</div>

// Accordion
<button aria-expanded="false" aria-controls="section-1" id="accordion-1">
  Section 1
</button>
<div id="section-1" role="region" aria-labelledby="accordion-1" hidden>...</div>

// Live region for notifications
<div aria-live="polite" aria-atomic="true">
  {/* Content updates announced to screen readers */}
</div>
```

### ARIA states to know
- `aria-expanded` — dropdowns, accordions, menus
- `aria-selected` — tabs, listbox options
- `aria-checked` — custom checkboxes, switches
- `aria-pressed` — toggle buttons
- `aria-hidden="true"` — hide decorative elements from AT (but NOT focusable children)
- `aria-label` / `aria-labelledby` — accessible name when visible text isn't enough
- `aria-describedby` — additional description (e.g., error messages)
- `aria-invalid` — form validation state
- `aria-required` — required field

### Live regions
```tsx
// Polite: announces after current speech finishes
<div aria-live="polite">{statusMessage}</div>

// Assertive: interrupts immediately (use sparingly)
<div aria-live="assertive">{criticalAlert}</div>

// Atomic: announce entire region, not just changed node
<div aria-live="polite" aria-atomic="true">{fullMessage}</div>
```

---

## Color & Contrast

### WCAG 2.2 AA requirements
- **Normal text** (≤ 18px or ≤ 14px bold): contrast ratio ≥ 4.5:1
- **Large text** (≥ 18px bold or ≥ 24px): contrast ratio ≥ 3:1
- **UI components & graphics**: contrast ratio ≥ 3:1

### OKLCH contrast calculation
OKLCH makes contrast predictable: the difference in Lightness (L) approximates perceived contrast.

```css
/* High contrast pair: L difference ~ 60% */
--fg: oklch(15% 0.02 280);    /* dark text */
--bg: oklch(98% 0.01 280);    /* light background */
/* L diff = 83% → excellent contrast */

/* Check with: abs(L1 - L2) >= 60 for AA, >= 70 for AAA */
```

Use tools: `apca-w3` for advanced contrast, or `colorjs.io` for OKLCH manipulation.

### Never rely on color alone
```tsx
// BAD
<span className="text-red-500">Error</span>

// GOOD
<span className="text-red-500 flex items-center gap-1">
  <AlertIcon aria-hidden="true" />
  <span>Error: Email is required</span>
</span>
```

---

## Forms

### Label association
Every input MUST have an associated label:
```tsx
// Explicit association
<label htmlFor="email">Email address</label>
<input id="email" type="email" aria-required="true" />

// Or implicit (input inside label)
<label>
  Email address
  <input type="email" />
</label>

// Or aria-label when visible label isn't possible (avoid if possible)
<input aria-label="Search products" type="search" />
```

### Error messages
```tsx
<input
  id="email"
  type="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <span id="email-error" role="alert" className="text-red-500">
    Please enter a valid email address
  </span>
)}
```

### Required fields
```tsx
<input required aria-required="true" />
{/* Or with asterisk explained */}
<label htmlFor="name">
  Name <span aria-label="required">*</span>
</label>
<p id="required-hint">* indicates required field</p>
```

### Grouping
```tsx
<fieldset>
  <legend>Notification preferences</legend>
  <label><input type="checkbox" /> Email</label>
  <label><input type="checkbox" /> Push</label>
</fieldset>
```

---

## Screen Readers

### Hidden content
```css
/* Visually hidden but accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Decorative elements
```tsx
<img src="decoration.svg" alt="" />           {/* Empty alt = decorative */}
<Icon aria-hidden="true" />                    {/* Hide icon from AT */}
<button aria-label="Close dialog">
  <XIcon aria-hidden="true" />
</button>
```

### Complex images
```tsx
<img src="chart.png" alt="Revenue growth chart showing 23% increase in Q3" />
{/* Or with detailed description */}
<figure>
  <img src="chart.png" alt="Revenue growth chart" aria-details="chart-desc" />
  <figcaption id="chart-desc">Detailed description of the chart data...</figcaption>
</figure>
```

---

## Motion & Accessibility

Already covered in `web-animation` skill. Key reminders:
- ALWAYS respect `prefers-reduced-motion`
- Never animate in a way that triggers vestibular disorders (parallax, large scale movements)
- Provide static alternatives for animated content

---

## Accessibility Recipes

### Recipe: Accessible modal dialog
```tsx
import * as Dialog from "@radix-ui/react-dialog";

// Radix handles: focus trap, Escape to close, return focus to trigger, aria attributes
<Dialog.Root>
  <Dialog.Trigger>Open dialog</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content aria-describedby="dialog-desc">
      <Dialog.Title>Dialog title</Dialog.Title>
      <Dialog.Description id="dialog-desc">
        Description of what this dialog does
      </Dialog.Description>
      {/* content */}
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Recipe: Accessible tabs
```tsx
import * as Tabs from "@radix-ui/react-tabs";

// Radix handles: roving tabindex, arrow key navigation, aria-selected, aria-controls
<Tabs.Root defaultValue="tab1">
  <Tabs.List aria-label="Account settings">
    <Tabs.Trigger value="tab1">Profile</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Password</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">...</Tabs.Content>
  <Tabs.Content value="tab2">...</Tabs.Content>
</Tabs.Root>
```

### Recipe: Accessible command palette
```tsx
// Keyboard: Arrow keys navigate, Enter selects, Escape closes
// Focus: Input stays focused, results have aria-selected
// Live region: announce result count
<div role="dialog" aria-label="Command palette">
  <input
    type="text"
    role="combobox"
    aria-expanded={results.length > 0}
    aria-controls="command-list"
    aria-activedescendant={activeId}
  />
  <ul id="command-list" role="listbox">
    {results.map((item, i) => (
      <li
        key={item.id}
        id={`cmd-${item.id}`}
        role="option"
        aria-selected={i === activeIndex}
      >
        {item.label}
      </li>
    ))}
  </ul>
  <div aria-live="polite" className="sr-only">
    {results.length} results available
  </div>
</div>
```

### Recipe: Accessible data table
```tsx
<table>
  <caption>Monthly revenue by region</caption>
  <thead>
    <tr>
      <th scope="col">Region</th>
      <th scope="col">Revenue</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th scope="row">North America</th>
      <td>$120,000</td>
    </tr>
  </tbody>
</table>
```

### Recipe: Accessible toast notifications
```tsx
// Use a live region at app root
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {toasts.map(t => t.message).join(', ')}
</div>

// Or with Sonner (accessible by default)
import { Toaster } from "sonner";
<Toaster position="bottom-right" />
```

---

## Testing Checklist

Before marking a component done, verify:
- [ ] All interactive elements work with keyboard only
- [ ] Focus order follows visual order
- [ ] Focus is visible on every interactive element
- [ ] ARIA roles, states, and properties are correct
- [ ] Color contrast meets WCAG AA (4.5:1 for text, 3:1 for UI)
- [ ] Information is not conveyed by color alone
- [ ] Images have appropriate alt text
- [ ] Forms have associated labels
- [ ] Error messages are associated with inputs
- [ ] Heading hierarchy is logical (no skipped levels)
- [ ] Page has one `<main>` and one `<h1>`
- [ ] `prefers-reduced-motion` is respected

## References
- **WAI-ARIA Authoring Practices** — w3.org/WAI/ARIA/apg
- **Radix UI** — accessible primitives (ui.shadcn.com is built on these)
- **axe-core** — automated accessibility testing
- **WebAIM Contrast Checker** — webaim.org/resources/contrastchecker
- **APCA** — advanced perceptual contrast algorithm (apcaw3.org)
