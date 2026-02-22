/**
 * GSAP Animation Utilities for Golid
 *
 * This module provides GSAP-based animations for complex page-level effects,
 * scroll triggers, and timeline-based sequences.
 *
 * @example
 * ```tsx
 * import { fadeInUp, staggerChildren, useScrollTrigger } from "~/lib/animation/gsap";
 *
 * // In component
 * onMount(() => {
 *   fadeInUp(heroRef);
 *   staggerChildren(cardsContainerRef, ".card", { delay: 0.1 });
 * });
 * ```
 */

import { gsap } from "gsap";
import { onMount, onCleanup } from "solid-js";

// ============================================================================
// GSAP Configuration
// ============================================================================

// Register plugins (ScrollTrigger requires separate import in production)
// import { ScrollTrigger } from "gsap/ScrollTrigger";
// gsap.registerPlugin(ScrollTrigger);

// Default easing curves
export const easings = {
  // Standard easings
  ease: "power2.out",
  easeIn: "power2.in",
  easeOut: "power2.out",
  easeInOut: "power2.inOut",

  // Smooth/gentle
  smooth: "power1.out",
  smoothIn: "power1.in",
  smoothOut: "power1.out",

  // Snappy/energetic
  snap: "power3.out",
  snapIn: "power3.in",
  snapOut: "power3.out",

  // Bounce effects
  bounce: "bounce.out",
  elastic: "elastic.out(1, 0.5)",

  // Back (overshoot)
  back: "back.out(1.7)",
  backIn: "back.in(1.7)",

  // Custom branded easing
  brand: "power2.out",
} as const;

// Default animation settings
export const defaults = {
  duration: 0.6,
  ease: easings.ease,
  stagger: 0.1,
};

// ============================================================================
// Basic Animations
// ============================================================================

/**
 * Fade in an element.
 */
export function fadeIn(
  element: Element | null,
  options: gsap.TweenVars = {}
): gsap.core.Tween | null {
  if (!element) return null;

  return gsap.fromTo(
    element,
    { opacity: 0 },
    {
      opacity: 1,
      duration: defaults.duration,
      ease: defaults.ease,
      ...options,
    }
  );
}

/**
 * Fade out an element.
 */
export function fadeOut(
  element: Element | null,
  options: gsap.TweenVars = {}
): gsap.core.Tween | null {
  if (!element) return null;

  return gsap.to(element, {
    opacity: 0,
    duration: defaults.duration * 0.75,
    ease: easings.easeIn,
    ...options,
  });
}

/**
 * Fade in and slide up (hero text, cards, etc.)
 */
export function fadeInUp(
  element: Element | null,
  options: gsap.TweenVars = {}
): gsap.core.Tween | null {
  if (!element) return null;

  return gsap.fromTo(
    element,
    { opacity: 0, y: 30 },
    {
      opacity: 1,
      y: 0,
      duration: defaults.duration,
      ease: defaults.ease,
      ...options,
    }
  );
}

/**
 * Fade in and slide down.
 */
export function fadeInDown(
  element: Element | null,
  options: gsap.TweenVars = {}
): gsap.core.Tween | null {
  if (!element) return null;

  return gsap.fromTo(
    element,
    { opacity: 0, y: -30 },
    {
      opacity: 1,
      y: 0,
      duration: defaults.duration,
      ease: defaults.ease,
      ...options,
    }
  );
}

/**
 * Fade in and slide from left.
 */
export function fadeInLeft(
  element: Element | null,
  options: gsap.TweenVars = {}
): gsap.core.Tween | null {
  if (!element) return null;

  return gsap.fromTo(
    element,
    { opacity: 0, x: -30 },
    {
      opacity: 1,
      x: 0,
      duration: defaults.duration,
      ease: defaults.ease,
      ...options,
    }
  );
}

/**
 * Fade in and slide from right.
 */
export function fadeInRight(
  element: Element | null,
  options: gsap.TweenVars = {}
): gsap.core.Tween | null {
  if (!element) return null;

  return gsap.fromTo(
    element,
    { opacity: 0, x: 30 },
    {
      opacity: 1,
      x: 0,
      duration: defaults.duration,
      ease: defaults.ease,
      ...options,
    }
  );
}

/**
 * Scale in with fade (modals, popovers).
 */
export function scaleIn(
  element: Element | null,
  options: gsap.TweenVars = {}
): gsap.core.Tween | null {
  if (!element) return null;

  return gsap.fromTo(
    element,
    { opacity: 0, scale: 0.95 },
    {
      opacity: 1,
      scale: 1,
      duration: defaults.duration * 0.75,
      ease: easings.back,
      ...options,
    }
  );
}

/**
 * Scale out with fade.
 */
export function scaleOut(
  element: Element | null,
  options: gsap.TweenVars = {}
): gsap.core.Tween | null {
  if (!element) return null;

  return gsap.to(element, {
    opacity: 0,
    scale: 0.95,
    duration: defaults.duration * 0.5,
    ease: easings.easeIn,
    ...options,
  });
}

// ============================================================================
// Stagger Animations
// ============================================================================

/**
 * Stagger animate children elements.
 *
 * @example
 * ```tsx
 * staggerChildren(containerRef, ".card", { delay: 0.1 });
 * ```
 */
export function staggerChildren(
  container: Element | null,
  selector: string,
  options: {
    delay?: number;
    stagger?: number;
    animation?: "fadeInUp" | "fadeIn" | "fadeInLeft" | "fadeInRight" | "scaleIn";
  } & gsap.TweenVars = {}
): gsap.core.Tween | null {
  if (!container) return null;

  const { delay = 0, stagger = defaults.stagger, animation = "fadeInUp", ...tweenVars } = options;
  const children = container.querySelectorAll(selector);

  if (children.length === 0) return null;

  const fromMap: Record<string, gsap.TweenVars> = {
    fadeInUp: { opacity: 0, y: 30 },
    fadeIn: { opacity: 0 },
    fadeInLeft: { opacity: 0, x: -30 },
    fadeInRight: { opacity: 0, x: 30 },
    scaleIn: { opacity: 0, scale: 0.95 },
  };

  const toMap: Record<string, gsap.TweenVars> = {
    fadeInUp: { opacity: 1, y: 0 },
    fadeIn: { opacity: 1 },
    fadeInLeft: { opacity: 1, x: 0 },
    fadeInRight: { opacity: 1, x: 0 },
    scaleIn: { opacity: 1, scale: 1 },
  };

  const fromVars = fromMap[animation];
  const toVars = toMap[animation];

  return gsap.fromTo(children, fromVars, {
    ...toVars,
    duration: defaults.duration,
    ease: defaults.ease,
    stagger,
    delay,
    ...tweenVars,
  });
}

/**
 * Stagger in a list of elements by index.
 */
export function staggerList(
  elements: Element[] | NodeListOf<Element> | null,
  options: gsap.TweenVars = {}
): gsap.core.Tween | null {
  if (!elements || (Array.isArray(elements) && elements.length === 0)) return null;

  return gsap.fromTo(
    elements,
    { opacity: 0, y: 20 },
    {
      opacity: 1,
      y: 0,
      duration: defaults.duration,
      ease: defaults.ease,
      stagger: defaults.stagger,
      ...options,
    }
  );
}

// ============================================================================
// Timeline Utilities
// ============================================================================

/**
 * Create a GSAP timeline with defaults.
 */
export function createTimeline(options: gsap.TimelineVars = {}): gsap.core.Timeline {
  return gsap.timeline({
    defaults: {
      duration: defaults.duration,
      ease: defaults.ease,
    },
    ...options,
  });
}

/**
 * Page entrance animation - orchestrates multiple elements.
 *
 * @example
 * ```tsx
 * onMount(() => {
 *   pageEntrance({
 *     navbar: navRef,
 *     hero: heroRef,
 *     content: contentRef,
 *   });
 * });
 * ```
 */
export function pageEntrance(elements: {
  navbar?: Element | null;
  hero?: Element | null;
  heroTitle?: Element | null;
  heroSubtitle?: Element | null;
  content?: Element | null;
  cards?: Element | null;
  cardSelector?: string;
}): gsap.core.Timeline {
  const tl = createTimeline();

  // Navbar slides down
  if (elements.navbar) {
    tl.fromTo(
      elements.navbar,
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4 },
      0
    );
  }

  // Hero section fades in
  if (elements.hero) {
    tl.fromTo(
      elements.hero,
      { opacity: 0 },
      { opacity: 1, duration: 0.5 },
      0.1
    );
  }

  // Hero title slides up
  if (elements.heroTitle) {
    tl.fromTo(
      elements.heroTitle,
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: easings.snap },
      0.2
    );
  }

  // Hero subtitle follows
  if (elements.heroSubtitle) {
    tl.fromTo(
      elements.heroSubtitle,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 },
      0.35
    );
  }

  // Content fades in
  if (elements.content) {
    tl.fromTo(
      elements.content,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5 },
      0.4
    );
  }

  // Cards stagger in
  if (elements.cards && elements.cardSelector) {
    const cards = elements.cards.querySelectorAll(elements.cardSelector);
    if (cards.length > 0) {
      tl.fromTo(
        cards,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1 },
        0.5
      );
    }
  }

  return tl;
}

// ============================================================================
// SolidJS Hooks
// ============================================================================

/**
 * Hook to run an animation on mount with automatic cleanup.
 *
 * @example
 * ```tsx
 * let ref: HTMLDivElement;
 *
 * useAnimation(() => fadeInUp(ref));
 *
 * return <div ref={ref}>Animated content</div>;
 * ```
 */
export function useAnimation(animationFn: () => gsap.core.Tween | gsap.core.Timeline | null) {
  onMount(() => {
    const animation = animationFn();

    onCleanup(() => {
      animation?.kill();
    });
  });
}

/**
 * Hook for scroll-triggered animations.
 * Note: Requires ScrollTrigger plugin to be registered.
 *
 * @example
 * ```tsx
 * let ref: HTMLDivElement;
 *
 * useScrollAnimation(ref, {
 *   animation: "fadeInUp",
 *   start: "top 80%",
 * });
 * ```
 */
export function useScrollAnimation(
  element: Element | null,
  options: {
    animation?: "fadeInUp" | "fadeIn" | "fadeInLeft" | "fadeInRight" | "scaleIn";
    start?: string;
    end?: string;
    scrub?: boolean | number;
    markers?: boolean;
  } = {}
) {
  const {
    animation = "fadeInUp",
    start = "top 80%",
    end = "bottom 20%",
    scrub = false,
    markers = false,
  } = options;

  onMount(() => {
    if (!element) return;

    // Check if ScrollTrigger is available
    // @ts-expect-error — gsap.plugins is not in the type definitions
    if (!gsap.plugins?.scrollTrigger) {
      console.warn("ScrollTrigger plugin not registered. Import and register it first.");
      // Fallback to immediate animation
      const animations: Record<string, () => gsap.core.Tween | null> = {
        fadeInUp: () => fadeInUp(element),
        fadeIn: () => fadeIn(element),
        fadeInLeft: () => fadeInLeft(element),
        fadeInRight: () => fadeInRight(element),
        scaleIn: () => scaleIn(element),
      };
      animations[animation]?.();
      return;
    }

    const fromVars: Record<string, gsap.TweenVars> = {
      fadeInUp: { opacity: 0, y: 50 },
      fadeIn: { opacity: 0 },
      fadeInLeft: { opacity: 0, x: -50 },
      fadeInRight: { opacity: 0, x: 50 },
      scaleIn: { opacity: 0, scale: 0.9 },
    };

    const toVars: Record<string, gsap.TweenVars> = {
      fadeInUp: { opacity: 1, y: 0 },
      fadeIn: { opacity: 1 },
      fadeInLeft: { opacity: 1, x: 0 },
      fadeInRight: { opacity: 1, x: 0 },
      scaleIn: { opacity: 1, scale: 1 },
    };

    // Set initial state
    gsap.set(element, fromVars[animation]);

    // Create scroll trigger
    const tween = gsap.to(element, {
      ...toVars[animation],
      duration: scrub ? 1 : defaults.duration,
      ease: scrub ? "none" : defaults.ease,
      scrollTrigger: {
        trigger: element,
        start,
        end: scrub ? end : undefined,
        scrub,
        markers,
        toggleActions: scrub ? undefined : "play none none reverse",
      },
    });

    onCleanup(() => {
      tween.kill();
      (tween as unknown as { scrollTrigger?: { kill: () => void } }).scrollTrigger?.kill();
    });
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Kill all GSAP animations on an element.
 */
export function killAnimations(element: Element | null): void {
  if (element) {
    gsap.killTweensOf(element);
  }
}

/**
 * Set initial hidden state for elements that will animate in.
 */
export function setHidden(elements: Element | Element[] | NodeListOf<Element> | null): void {
  if (elements) {
    gsap.set(elements, { opacity: 0 });
  }
}

/**
 * Quick context for batch animations with auto cleanup.
 */
export function createAnimationContext() {
  const ctx = gsap.context(() => {});

  onCleanup(() => {
    ctx.revert();
  });

  return ctx;
}

// Export GSAP for direct use
export { gsap };
