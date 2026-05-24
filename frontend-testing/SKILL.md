---
name: frontend-testing
description: Write comprehensive tests for frontend applications. Use this skill when creating components, pages, or features to ensure they work correctly and remain stable. Covers unit tests, component tests, E2E tests, visual regression, accessibility testing, and mocking strategies.
license: Complete terms in LICENSE.txt
---

This skill ensures every frontend output is tested, stable, and maintainable. Tests are not optional — they are part of the implementation.

## Testing Pyramid (Frontend)

| Type | Speed | Cost | Purpose | Tools |
|---|---|---|---|---|
| **Unit** | Fast | Cheap | Pure functions, utilities, hooks | Vitest, Jest |
| **Component** | Fast | Cheap | Component behavior in isolation | Testing Library + Vitest |
| **Integration** | Medium | Medium | Multiple components working together | Testing Library + Vitest |
| **E2E** | Slow | Expensive | Full user flows across pages | Playwright, Cypress |
| **Visual** | Slow | Expensive | Catch unintended UI changes | Storybook + Chromatic, Percy |
| **A11y** | Fast | Cheap | Automated accessibility checks | axe-core, @axe-core/react |

**Rule of thumb**: 70% unit/component, 20% integration, 10% E2E.

---

## Component Testing with Testing Library

### Philosophy
- Test behavior, not implementation
- Query elements the way users would (text, label, role)
- Avoid testing CSS classes or internal state

### Queries (priority order)
1. `getByRole` — most robust, checks ARIA
2. `getByLabelText` — form inputs
3. `getByPlaceholderText` — form inputs
4. `getByText` — text content
5. `getByDisplayValue` — current form value
6. `getByAltText` — images
7. `getByTitle` — tooltips
8. `getByTestId` — last resort (avoid if possible)

```tsx
// GOOD
screen.getByRole("button", { name: /submit/i });
screen.getByLabelText(/email address/i);
screen.getByRole("heading", { name: /welcome/i, level: 1 });

// AVOID
screen.getByTestId("submit-btn");
document.querySelector(".btn-primary");
```

### Async testing
```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

it("shows search results", async () => {
  render(<Search />);
  const user = userEvent.setup();

  await user.type(screen.getByRole("searchbox"), "react");
  await waitFor(() => {
    expect(screen.getByText(/react docs/i)).toBeInTheDocument();
  });
});
```

### User events
Always use `@testing-library/user-event` over `fireEvent`:
```tsx
const user = userEvent.setup();

await user.click(button);
await user.type(input, "hello{Enter}");
await user.keyboard("{Escape}");
await user.hover(element);
await user.selectOptions(select, ["option1", "option2"]);
```

### Testing hooks
```tsx
import { renderHook, act } from "@testing-library/react";

it("increments counter", () => {
  const { result } = renderHook(() => useCounter());
  act(() => result.current.increment());
  expect(result.current.count).toBe(1);
});
```

---

## Mocking

### Mock external modules
```tsx
import { vi } from "vitest";

vi.mock("./api", () => ({
  fetchUser: vi.fn(() => Promise.resolve({ id: 1, name: "John" })),
}));
```

### Mock fetch
```tsx
const mockFetch = vi.fn();
global.fetch = mockFetch;

mockFetch.mockResolvedValueOnce({
  json: () => Promise.resolve({ data: [] }),
  ok: true,
});
```

### Mock timers
```tsx
vi.useFakeTimers();

act(() => vi.advanceTimersByTime(1000));

vi.useRealTimers();
```

### Mock router (Next.js)
```tsx
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams("?q=test"),
}));
```

---

## E2E Testing with Playwright

### Why Playwright over Cypress
- Multiple browser engines (Chromium, Firefox, WebKit)
- Auto-waiting built in
- Parallel execution
- API testing in same test
- Better CI integration

### Basic test
```tsx
import { test, expect } from "@playwright/test";

test("user can search", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox").fill("react");
  await page.getByRole("button", { name: /search/i }).click();
  await expect(page.getByText(/results/i)).toBeVisible();
});
```

### Visual regression
```tsx
test("homepage visual regression", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveScreenshot("homepage.png", {
    fullPage: true,
    threshold: 0.2,
  });
});
```

### Accessibility scan
```tsx
import { injectAxe, checkA11y } from "axe-playwright";

test("page has no accessibility violations", async ({ page }) => {
  await page.goto("/");
  await injectAxe(page);
  await checkA11y(page);
});
```

### Mobile testing
```tsx
test("mobile menu works", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/");
  await page.getByRole("button", { name: /menu/i }).click();
  await expect(page.getByRole("navigation")).toBeVisible();
});
```

---

## Accessibility Testing

### axe-core in component tests
```tsx
import { axe } from "jest-axe";  // or vitest-axe

it("has no accessibility violations", async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### React integration
```tsx
import React from "react";
import ReactDOM from "react-dom";
import axe from "@axe-core/react";

if (process.env.NODE_ENV !== "production") {
  axe(React, ReactDOM, 1000);
}
```

### What axe catches automatically
- Missing alt text on images
- Insufficient color contrast
- Missing form labels
- Invalid ARIA
- Missing heading hierarchy
- Focusable elements without proper roles

### What axe CANNOT catch (manual testing needed)
- Keyboard navigation flow
- Screen reader announcements
- Focus management
- Custom interaction patterns

---

## Storybook

Use Storybook for:
- Component documentation
- Visual regression testing (with Chromatic)
- Manual accessibility testing
- Design review

### Story example
```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  component: Button,
  args: { children: "Click me" },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { variant: "primary" } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
```

### Accessibility addon
```tsx
// .storybook/main.ts
export default {
  addons: ["@storybook/addon-a11y"],
};
```

### Visual regression with Chromatic
```bash
npx chromatic --project-token=YOUR_TOKEN
```

---

## Test Organization

### File structure
```
src/
  components/
    Button/
      Button.tsx
      Button.test.tsx          # Component test (co-located)
      Button.stories.tsx        # Storybook stories
  hooks/
    useCounter.ts
    useCounter.test.ts         # Hook test
  utils/
    formatDate.ts
    formatDate.test.ts         # Unit test
  app/
    page.tsx
  e2e/
    search.spec.ts             # E2E tests
```

### Naming conventions
- `*.test.tsx` — Component/unit tests (Vitest/Jest)
- `*.spec.ts` — E2E tests (Playwright)
- `*.stories.tsx` — Storybook stories

### Test data
Use factories, not fixtures:
```tsx
function createUser(overrides = {}) {
  return {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    ...overrides,
  };
}

// Usage
const admin = createUser({ role: "admin" });
```

---

## Testing Recipes

### Recipe: Testing a form
```tsx
it("submits form with valid data", async () => {
  const onSubmit = vi.fn();
  render(<ContactForm onSubmit={onSubmit} />);
  const user = userEvent.setup();

  await user.type(screen.getByLabelText(/name/i), "John Doe");
  await user.type(screen.getByLabelText(/email/i), "john@example.com");
  await user.click(screen.getByRole("button", { name: /send/i }));

  await waitFor(() => {
    expect(onSubmit).toHaveBeenCalledWith({
      name: "John Doe",
      email: "john@example.com",
    });
  });
});

it("shows validation errors", async () => {
  render(<ContactForm onSubmit={vi.fn()} />);
  await userEvent.click(screen.getByRole("button", { name: /send/i }));

  expect(screen.getByText(/name is required/i)).toBeInTheDocument();
  expect(screen.getByText(/email is required/i)).toBeInTheDocument();
});
```

### Recipe: Testing async data fetching
```tsx
it("displays loading then data", async () => {
  vi.mocked(fetchUser).mockResolvedValueOnce({ name: "Jane" });

  render(<UserProfile userId="1" />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  await waitFor(() => {
    expect(screen.getByText(/jane/i)).toBeInTheDocument();
  });
});

it("displays error state", async () => {
  vi.mocked(fetchUser).mockRejectedValueOnce(new Error("Failed"));

  render(<UserProfile userId="1" />);
  await waitFor(() => {
    expect(screen.getByText(/failed to load user/i)).toBeInTheDocument();
  });
});
```

### Recipe: Testing with context/provider
```tsx
function renderWithProviders(ui, { providerProps = {} } = {}) {
  return render(
    <ThemeProvider {...providerProps}>
      <AuthProvider>{ui}</AuthProvider>
    </ThemeProvider>
  );
}

it("renders with theme", () => {
  renderWithProviders(<Button>Click</Button>, {
    providerProps: { defaultTheme: "dark" },
  });
  expect(screen.getByRole("button")).toHaveClass("dark");
});
```

### Recipe: Testing drag and drop (Playwright)
```tsx
test("reorders items via drag and drop", async ({ page }) => {
  await page.goto("/kanban");

  const source = page.getByText("Task A");
  const target = page.getByText("Task B");

  await source.dragTo(target);
  await expect(page.getByText("Task A")).toHaveAttribute("data-order", "2");
});
```

---

## CI/CD Integration

### Vitest + GitHub Actions
```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - run: npm run test:e2e
```

### Coverage thresholds
```ts
// vitest.config.ts
export default {
  test: {
    coverage: {
      reporter: ["text", "json", "html"],
      thresholds: {
        statements: 80,
        branches: 70,
        functions: 80,
        lines: 80,
      },
    },
  },
};
```

---

## Testing Checklist

Before shipping a component or feature:
- [ ] Component renders and basic interactions work (unit/component test)
- [ ] Edge cases handled (empty state, error state, loading state)
- [ ] Async operations tested (loading -> success, loading -> error)
- [ ] Accessibility scan passes (axe-core)
- [ ] Keyboard navigation works (manual test)
- [ ] Critical user flows tested (E2E with Playwright)
- [ ] Visual regression baseline established (Storybook + Chromatic)
- [ ] Coverage meets team threshold (min 70%)

## References
- **Testing Library** — testing-library.com (priority: queries, user-event)
- **Playwright** — playwright.dev (E2E, visual regression)
- **Vitest** — vitest.dev (fast unit testing)
- **Storybook** — storybook.js.org (component docs, visual testing)
- **axe-core** — deque.com/axe (accessibility testing)
- **Chromatic** — chromatic.com (visual regression for Storybook)
