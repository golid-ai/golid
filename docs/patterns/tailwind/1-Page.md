# Tailwind CSS — 1-Page

**Thesis**: Utility-first CSS that scales. Design in the markup, not the stylesheet.

**Refrain**: Extend, don't override. Use HSL variables. Compose with `cn()`.

---

### Mental Model

```
UTILITY CLASSES → NO CUSTOM CSS
├── Responsive: sm: md: lg: xl: 2xl:
├── States: hover: focus: active: disabled:
├── Dark mode: dark:
└── Variants: compose with tailwind-variants
```

### The `cn()` Function (Essential)

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Later classes win
cn('px-4', 'px-6')  // → 'px-6'
cn('text-red-500', isError && 'text-blue-500')
```

### HSL Theme System

```css
/* app.css */
:root {
  --primary: 221 83% 53%;       /* H S% L% — no hsl() wrapper */
  --primary-foreground: 210 40% 98%;
}
.dark {
  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 11%;
}
```

```javascript
// tailwind.config.js
colors: {
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))'
  }
}
```

```html
<div class="bg-primary/50">50% opacity works!</div>
```

### Class Order

```
Layout → Position → Box Model → Typography → Visual → Effects → States → Responsive

<button class="
  flex items-center justify-center gap-2      /* Layout */
  h-10 px-6                                    /* Box Model */
  text-sm font-medium text-white               /* Typography */
  bg-blue-600 rounded-lg shadow-sm             /* Visual */
  transition-colors                            /* Effects */
  hover:bg-blue-700 focus:ring-2               /* States */
">
```

### Breakpoints (Mobile-First)

| Prefix | Min Width |
|--------|-----------|
| (none) | 0px |
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Dark Mode

```javascript
// tailwind.config.js
darkMode: 'class'
```

```html
<div class="bg-white dark:bg-slate-900 text-black dark:text-white">
```

### Variant Components (tailwind-variants)

```typescript
import { tv } from 'tailwind-variants';

const button = tv({
  base: 'rounded-md font-medium transition-colors',
  variants: {
    variant: {
      primary: 'bg-primary text-primary-foreground',
      outline: 'border border-input bg-background',
    },
    size: {
      sm: 'h-9 px-3 text-sm',
      md: 'h-10 px-4',
      lg: 'h-11 px-8',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
});

button({ variant: 'outline', size: 'lg' })
```

### Quick Components

```html
<!-- Button -->
<button class="h-10 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">

<!-- Input -->
<input class="h-10 w-full px-3 rounded-md border border-input bg-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring" />

<!-- Card -->
<div class="rounded-lg border bg-card p-6 shadow-sm">

<!-- Badge -->
<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-primary text-primary-foreground">
```

### Accessibility

```html
<!-- Always visible focus -->
<button class="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">

<!-- Screen reader only -->
<span class="sr-only">Close menu</span>

<!-- Respect motion preferences -->
<div class="motion-reduce:transition-none motion-reduce:animate-none">
```

### Animation

```html
<div class="animate-spin">Loading</div>
<div class="animate-pulse">Skeleton</div>
<div class="transition-transform hover:scale-105">Hover scale</div>
```

### Performance Rules

| Do | Don't |
|----|-------|
| Complete class names | Dynamic: `` `bg-${color}-500` `` |
| Extend in config | Override base theme |
| `cn()` for conditionals | String concatenation |

### Anti-Patterns

| Bad | Why | Good |
|-----|-----|------|
| `@apply` everywhere | Defeats utility-first | Use utilities directly |
| Dynamic class strings | Can't purge | Use object lookup |
| No focus states | Inaccessible | Always `focus-visible:` |
| Ignoring dark mode | Poor UX | Include `dark:` variants |

### Essential Config

```javascript
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{html,js,ts,jsx,tsx,svelte}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
      }
    }
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ]
}
```

### Definition of Done

- [ ] HSL variables for theming
- [ ] `cn()` for class composition
- [ ] Dark mode variants
- [ ] Focus states on interactive elements
- [ ] Motion-reduced alternatives
- [ ] No dynamic class strings

---
