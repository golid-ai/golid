# Animation System

Golid uses **two animation libraries** for different use cases:

| Library | Bundle | Use Case |
|---------|--------|----------|
| **GSAP** | ~60KB | Page animations, scroll triggers, complex timelines |
| **Motion One** | ~18KB | Component animations, micro-interactions |

---

## Quick Start

```tsx
// Import what you need
import {
  // GSAP functions
  fadeInUp, staggerChildren, useAnimation,

  // Motion One components
  Motion, Presence, presets,

  // Animated wrappers
  AnimatedCard, AnimatedList, AnimatedCounter,
} from "~/lib/animation";
```

---

## Motion One (Components)

### Basic Usage

```tsx
import { Motion, Presence, presets } from "~/lib/animation";

// Simple entrance animation
<Motion.div
  initial={presets.fadeInUp.initial}
  animate={presets.fadeInUp.animate}
  transition={presets.fadeInUp.transition}
>
  Hello World
</Motion.div>
```

### Available Presets

| Preset | Description |
|--------|-------------|
| `fadeIn` / `fadeOut` | Simple opacity |
| `fadeInUp` / `fadeInDown` | Fade + slide vertical |
| `fadeInLeft` / `fadeInRight` | Fade + slide horizontal |
| `scaleIn` / `scaleOut` | Fade + scale with back easing |
| `pop` | Spring-based pop effect |
| `slideUp/Down/Left/Right` | Pure slide (no fade) |
| `collapse` / `expand` | Height animations |

### Animated Components

```tsx
import { AnimatedCard, AnimatedList, AnimatedCounter } from "~/components/atoms";

// Animated card with hover
<AnimatedCard animation="fadeInUp" delay={0.1}>
  <h2>Card Title</h2>
</AnimatedCard>

// Staggered list
<AnimatedList each={items()} stagger={0.05}>
  {(item) => <div>{item.name}</div>}
</AnimatedList>

// Counting number
<AnimatedCounter
  value={12500}
  prefix="$"
  suffix="/mo"
  format={(n) => n.toLocaleString()}
/>
```

### Enter/Exit Animations

```tsx
import { AnimatedPresence } from "~/components/atoms";

<AnimatedPresence when={isOpen()} enter="scaleIn" exit="fadeOut">
  <Modal>...</Modal>
</AnimatedPresence>
```

### Micro-interactions

```tsx
import { buttonPress, shake, pulse, bounce } from "~/lib/animation";

// On button click
const handleClick = () => {
  buttonPress(buttonRef);
};

// Shake on error
if (hasError) {
  shake(inputRef);
}

// Pulse for attention
pulse(notificationRef);
```

---

## GSAP (Page-Level)

### On-Mount Animation

```tsx
import { fadeInUp, useAnimation } from "~/lib/animation";

function HeroSection() {
  let heroRef: HTMLDivElement;

  useAnimation(() => fadeInUp(heroRef));

  return <div ref={heroRef}>Hero Content</div>;
}
```

### Stagger Children

```tsx
import { staggerChildren, useAnimation } from "~/lib/animation";

function CardGrid() {
  let gridRef: HTMLDivElement;

  useAnimation(() => staggerChildren(gridRef, ".card", { stagger: 0.1 }));

  return (
    <div ref={gridRef}>
      <div class="card">1</div>
      <div class="card">2</div>
      <div class="card">3</div>
    </div>
  );
}
```

### Page Entrance Timeline

```tsx
import { pageEntrance } from "~/lib/animation";

function LandingPage() {
  let navRef, heroRef, heroTitleRef, cardsRef: HTMLDivElement;

  onMount(() => {
    pageEntrance({
      navbar: navRef,
      hero: heroRef,
      heroTitle: heroTitleRef,
      cards: cardsRef,
      cardSelector: ".feature-card",
    });
  });

  return (
    <>
      <nav ref={navRef}>...</nav>
      <section ref={heroRef}>
        <h1 ref={heroTitleRef}>Welcome</h1>
      </section>
      <div ref={cardsRef}>
        <div class="feature-card">...</div>
        <div class="feature-card">...</div>
      </div>
    </>
  );
}
```

### Custom Timeline

```tsx
import { createTimeline, easings } from "~/lib/animation";

onMount(() => {
  const tl = createTimeline();

  tl.to(logoRef, { scale: 1.2, duration: 0.3 })
    .to(logoRef, { scale: 1, duration: 0.3 })
    .to(textRef, { opacity: 1, y: 0 }, "-=0.1"); // overlap
});
```

### Scroll-Triggered (requires ScrollTrigger)

```tsx
import { useScrollAnimation } from "~/lib/animation";

function Section() {
  let sectionRef: HTMLDivElement;

  useScrollAnimation(sectionRef, {
    animation: "fadeInUp",
    start: "top 80%",
  });

  return <section ref={sectionRef}>...</section>;
}
```

---

## Easing Reference

### GSAP Easings

```tsx
import { easings } from "~/lib/animation";

// Available easings
easings.ease      // power2.out (default)
easings.smooth    // power1.out (gentle)
easings.snap      // power3.out (snappy)
easings.bounce    // bounce.out
easings.elastic   // elastic.out(1, 0.5)
easings.back      // back.out(1.7) (overshoot)
```

### Motion One Springs

```tsx
import { springs } from "~/lib/animation";

springs.gentle    // Modals, overlays
springs.bouncy    // Buttons, notifications
springs.snappy    // Toggles, switches
springs.wobbly    // Playful elements
```

---

## Performance Tips

1. **Use CSS for simple transitions** - `transition: all 0.2s` for hovers
2. **Prefer Motion One for components** - Lighter bundle
3. **Use GSAP for complex sequences** - Timelines, scroll triggers
4. **Avoid animating layout properties** - Use `transform` and `opacity`
5. **Use `will-change` sparingly** - Only for heavy animations
