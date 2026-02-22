# Accessibility

Golid components follow WAI-ARIA practices and are tested with axe-core in CI.

## Running Accessibility Tests

Component tests run axe automatically:

```bash
cd frontend && npm test
```

Any component test using `@solidjs/testing-library` can add axe verification:

```tsx
import { axe } from "vitest-axe";

const { container } = render(() => <MyComponent />);
expect(await axe(container)).toHaveNoViolations();
```

## Requirements for New Components

### Interactive Elements

- Buttons with only an icon must have `aria-label`
- Form inputs must have associated `<label>` or `aria-label`
- Error messages must be linked via `aria-describedby`

### Loading States

- Containers with spinners must have `aria-live="polite"` and `aria-busy="true"`
- Spinner elements should have `role="status"`
- Include `<span class="sr-only">Loading...</span>` for screen readers

### Modals

- Must have `role="dialog"` and `aria-modal="true"`
- Must trap focus (Tab cycles within modal)
- Must restore focus on close
- Must close on Escape

### Keyboard Navigation

- All interactive elements must be reachable via Tab
- Custom components (Select, Tabs, SortableList) must support arrow keys
- Focus indicators must be visible (`focus-visible:` styles)

### Content

- Images must have `alt` text
- Color must not be the sole indicator of state (use icons + text)
- Animations respect `prefers-reduced-motion`

## Existing Component Patterns

| Component | Accessibility features |
|-----------|----------------------|
| Button | `aria-busy`, `aria-live="polite"` on loading state |
| Modal | Focus trap, Escape close, `aria-modal`, focus restore |
| Input | `aria-describedby` for errors, floating label |
| SortableList | `aria-grabbed`, keyboard drag, `role="list"` |
| Spinner | `role="status"`, `aria-live="polite"` |
| Select | `aria-activedescendant`, Home/End keys |
| Tabs | WAI-ARIA tabs pattern, arrow key navigation |
| Calendar | `aria-label` on navigation buttons |
| PasswordInput | `sr-only` text for visibility toggle |

## Testing Checklist for New Components

1. Render with axe and verify no violations
2. Verify keyboard-only navigation (Tab, Enter, Space, Escape, Arrow keys as applicable)
3. Verify screen reader announces state changes (`aria-live` regions)
4. Verify focus management (modals trap, restore on close)
5. Verify visible focus indicators in both light and dark mode
