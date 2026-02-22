# Golid Component Library

> Atomic Design System built with SolidJS + Tailwind CSS + tailwind-variants

---

## Overview

The component library follows **Atomic Design** principles:

```
Atoms       → Basic building blocks (Button, Input, Badge)
Molecules   → Combinations of atoms (Card, Modal, Tabs)
Organisms   → Complex UI sections (Navbar, Sidebar, AppLayout)
```

All components are:
- **Type-safe** - Full TypeScript with exported prop types
- **Variant-based** - Using `tailwind-variants` for consistent styling
- **Theme-aware** - HSL CSS variables for light/dark mode
- **Accessible** - ARIA labels, keyboard navigation

---

## Import Pattern

```tsx
// Import from the main barrel file
import { Button, Card, Modal, AppLayout } from "~/components";

// Or import directly for tree-shaking
import { Button } from "~/components/atoms/button";
```

---

## Atoms (30+ components)

### Button

```tsx
import { Button } from "~/components";

// Variants: primary, secondary, outline, ghost, destructive
// Sizes: sm, md, lg, icon-sm, icon-lg
// States: loading, disabled

<Button variant="primary" size="lg" loading>
  Submit
</Button>

<Button variant="outline" as="a" href="/about">
  Learn More
</Button>

<Button variant="ghost" size="icon-sm">
  <span class="material-symbol">close</span>
</Button>
```

### Input

```tsx
import { Input } from "~/components";

// Sizes: sm, md, lg
// States: error, disabled

<Input
  placeholder="Enter email"
  type="email"
  error="Invalid email format"
/>

<Input prefix={<span class="material-symbol">search</span>} />
```

### Badge

```tsx
import { Badge } from "~/components";

// Variants: default, primary, success, warning, destructive, info, outline
// Sizes: sm, md, lg

<Badge variant="success">Active</Badge>
<Badge variant="destructive" dot>Error</Badge>
```

### Other Atoms

| Component | Purpose |
|-----------|---------|
| `Input` | Text input with variants |
| `Textarea` | Multi-line text |
| `Select` | Dropdown select |
| `Checkbox` | Checkbox input |
| `Switch` | Toggle switch |
| `RadioGroup` | Radio button group |
| `Label` | Form labels |
| `Avatar` | User avatars |
| `AvatarGroup` | Stacked avatars |
| `Spinner` | Loading spinner |
| `Progress` | Progress bar |
| `Skeleton` | Loading placeholder |
| `Chip` | Tag/chip component |
| `ChipGroup` | Multi-select chips |
| `Slider` | Range slider |
| `Link` | Styled links |
| `Tooltip` | Hover tooltips |
| `Toaster` / `toast()` | Toast notifications |
| `StarRating` | Star rating display + interactive (1-5, half-star, 3 sizes) |
| `Calendar` | Date picker calendar |
| `ComingSoon` | Placeholder for upcoming features |

---

## Molecules (20+ components)

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "~/components";

// Variants: default, interactive, elevated, ghost
// Padding: none, sm, md, lg

<Card variant="interactive">
  <CardHeader>
    <CardTitle>Project Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    Main content here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Modal / Dialog

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "~/components";

<Dialog>
  <DialogTrigger>
    <Button>Open Modal</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
    </DialogHeader>
    <p>Are you sure you want to proceed?</p>
  </DialogContent>
</Dialog>

// Shorthand for confirmations
import { ConfirmDialog } from "~/components";

<ConfirmDialog
  title="Delete Item?"
  description="This cannot be undone."
  onConfirm={() => handleDelete()}
  variant="destructive"
/>
```

### Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components";

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Overview</TabsTrigger>
    <TabsTrigger value="tab2">Details</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">
    Tab 1 content
  </TabsContent>
  <TabsContent value="tab2">
    Tab 2 content
  </TabsContent>
</Tabs>
```

### Other Molecules

| Component | Purpose |
|-----------|---------|
| `Alert` | Alert banners (info, success, warning, error) |
| `Accordion` | Collapsible sections |
| `Breadcrumbs` | Navigation breadcrumbs |
| `Pagination` | Page navigation |
| `DropdownMenu` | Dropdown menus |
| `PasswordInput` | Password with show/hide |
| `EmptyState` | Empty state placeholders |
| `PageHeader` | Page title + description + actions |
| `LoadingOverlay` | Full-page loading |
| `AppErrorBoundary` | Error boundary wrapper |
| `Dropzone` | Drag-and-drop file upload (native browser API) |
| `NumberInput` | Numeric input with increment/decrement |
| `DatePicker` | Date selection with calendar popup |
| `Select` / `SelectItem` | Dropdown select (styled, not native) |
| `MultiSelect` / `MultiSelectItem` | Multi-select with chips |
| `DestructiveModal` | Confirmation modal for destructive actions |
| `SnackbarManager` | Snackbar toast queue |

---

## Organisms (5+ components)

### AppLayout

The main layout wrapper for authenticated pages:

```tsx
import { AppLayout } from "~/components";

<AppLayout showFooter>
  <DashboardContent />
</AppLayout>
```

Features:
- Navbar at top with sidebar toggle
- Collapsible sidebar (desktop: narrow/wide, mobile: overlay)
- Content area with proper margins
- Optional footer

### Navbar

Top navigation bar:

```tsx
import { Navbar } from "~/components";

// Public pages
<Navbar />

// Authenticated pages with sidebar toggle
<Navbar showMenuButton onMenuToggle={toggleSidebar} />
```

### Sidebar

Role-based navigation sidebar:

```tsx
import { Sidebar } from "~/components";

<Sidebar
  collapsed={isCollapsed()}
  onToggle={() => setCollapsed(!isCollapsed())}
/>
```

Features:
- Desktop: Collapsible (256px → 80px)
- Mobile: Full-screen overlay with grid layout
- Role-based nav filtering (admin/user)
- Active state indicators

### Footer

Page footer:

```tsx
import { Footer } from "~/components";

<Footer />          // Full footer
<Footer minimal />  // Minimal inline footer
```

---

## Utility Components

### Skeletons

Content-aware loading states:

```tsx
import { DashboardSkeleton, ListPageSkeleton, CardSkeleton, Skeleton, SkeletonText } from "~/components";

// Full page skeletons
<DashboardSkeleton />   // Dashboard layout
<ListPageSkeleton />    // List page layout

// Individual skeletons
<Skeleton class="h-8 w-64" />
<SkeletonText lines={3} />
<CardSkeleton />
```

### Error Boundary

```tsx
import { AppErrorBoundary, InlineError } from "~/components";

<AppErrorBoundary>
  <RiskyComponent />
</AppErrorBoundary>

// Inline error for smaller sections
<InlineError error={err} reset={retry} />
```

---

## Hooks

### useBreakpoint

Responsive breakpoint detection:

```tsx
import { useIsMobile, useBreakpoint, useCurrentBreakpoint } from "~/lib/hooks";

// Check if below breakpoint
const isMobile = useIsMobile();  // < 1024px
const isTablet = useBreakpoint("md");  // < 768px

// Get current breakpoint name
const bp = useCurrentBreakpoint();  // 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
```

---

## Theming

### CSS Variables

All colors use HSL CSS variables in `app.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 220 20% 8%;
  --primary: 175 77% 38%;
  --muted: 220 5% 92%;
  /* ... */
}

.dark {
  --background: 220 20% 8%;
  --foreground: 220 4% 95%;
  /* ... */
}
```

### Using Colors

```tsx
// In Tailwind classes
<div class="bg-background text-foreground" />
<div class="bg-primary text-primary-foreground" />
<div class="text-muted-foreground" />

// Brand color (teal)
<div class="text-teal bg-teal/10" />
```

---

## Design System Page

Visit `/components` (admin only) to explore all components interactively.

Features:
- Color palette with copy-to-clipboard
- Typography samples
- All component variants
- Toggle sections on/off

---

## File Structure

```
frontend/src/components/
├── atoms/
│   ├── button.tsx
│   ├── input.tsx
│   ├── badge.tsx
│   ├── ...
│   └── index.ts          # Barrel export
├── molecules/
│   ├── card.tsx
│   ├── modal.tsx
│   ├── tabs.tsx
│   ├── ...
│   └── index.ts
├── organisms/
│   ├── app-layout.tsx
│   ├── dashboard-skeleton.tsx
│   ├── navigation/
│   │   ├── navbar.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   └── index.ts
└── index.ts              # Main barrel export
```

---

## Adding New Components

1. Create file in appropriate folder (atoms/molecules/organisms)
2. Use `tailwind-variants` for variant definitions
3. Export component and types
4. Add to folder's `index.ts`
5. Add to main `components/index.ts`
6. Add to design system page if applicable

```tsx
// Example: New atom
import { tv, type VariantProps } from "tailwind-variants";

const newComponentVariants = tv({
  base: "...",
  variants: {
    size: { sm: "...", md: "...", lg: "..." },
  },
  defaultVariants: { size: "md" },
});

type NewComponentVariants = VariantProps<typeof newComponentVariants>;

interface NewComponentProps extends NewComponentVariants {
  // ...
}

export function NewComponent(props: NewComponentProps) {
  // ...
}

export { newComponentVariants };
export type { NewComponentProps, NewComponentVariants };
```
