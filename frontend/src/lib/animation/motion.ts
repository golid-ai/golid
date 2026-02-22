/**
 * Motion One Animation Utilities for Golid
 *
 * This module provides Motion One-based animations for component-level effects.
 * Motion One is lighter than GSAP and has a Framer Motion-like API.
 *
 * Uses:
 * - `solid-motionone` for declarative <Motion> components
 * - `motion` for imperative animate() functions
 *
 * @example
 * ```tsx
 * import { Motion, Presence, presets } from "~/lib/animation/motion";
 *
 * <Motion.div
 *   initial={presets.fadeInUp.initial}
 *   animate={presets.fadeInUp.animate}
 *   exit={presets.fadeOut.animate}
 * >
 *   Content
 * </Motion.div>
 * ```
 */

import { animate, stagger, timeline, spring, type AnimationControls, type MotionKeyframesDefinition, type AnimationOptionsWithOverrides } from "motion";

// Re-export Motion components from solid-motionone (community maintained)
export { Motion, Presence } from "solid-motionone";

// ============================================================================
// Animation Presets (Framer Motion style)
// ============================================================================

/**
 * Animation presets for Motion components.
 * Use with Motion.div initial/animate/exit props.
 */
export const presets = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3 },
  },
  fadeOut: {
    initial: { opacity: 1 },
    animate: { opacity: 0 },
    transition: { duration: 0.2 },
  },

  // Slide + fade animations
  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, easing: [0.25, 0.1, 0.25, 1] },
  },
  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, easing: [0.25, 0.1, 0.25, 1] },
  },
  fadeInLeft: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, easing: [0.25, 0.1, 0.25, 1] },
  },
  fadeInRight: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.4, easing: [0.25, 0.1, 0.25, 1] },
  },

  // Scale animations
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.3, easing: [0.34, 1.56, 0.64, 1] }, // Back easing
  },
  scaleOut: {
    initial: { opacity: 1, scale: 1 },
    animate: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 },
  },

  // Pop (for buttons, notifications)
  pop: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.25, easing: spring({ stiffness: 400, damping: 25 }) },
  },

  // Slide animations (no fade)
  slideUp: {
    initial: { y: "100%" },
    animate: { y: 0 },
    transition: { duration: 0.4, easing: [0.25, 0.1, 0.25, 1] },
  },
  slideDown: {
    initial: { y: "-100%" },
    animate: { y: 0 },
    transition: { duration: 0.4, easing: [0.25, 0.1, 0.25, 1] },
  },
  slideLeft: {
    initial: { x: "100%" },
    animate: { x: 0 },
    transition: { duration: 0.4, easing: [0.25, 0.1, 0.25, 1] },
  },
  slideRight: {
    initial: { x: "-100%" },
    animate: { x: 0 },
    transition: { duration: 0.4, easing: [0.25, 0.1, 0.25, 1] },
  },

  // Collapse/expand (for accordions)
  collapse: {
    initial: { height: "auto", opacity: 1 },
    animate: { height: 0, opacity: 0 },
    transition: { duration: 0.3 },
  },
  expand: {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    transition: { duration: 0.3 },
  },
} as const;

// ============================================================================
// Imperative Animation Functions
// ============================================================================

/**
 * Animate an element imperatively.
 *
 * @example
 * ```tsx
 * let buttonRef: HTMLButtonElement;
 *
 * const handleClick = () => {
 *   animateElement(buttonRef, { scale: [1, 1.1, 1] }, { duration: 0.2 });
 * };
 * ```
 */
export function animateElement(
  element: Element | null,
  keyframes: Record<string, unknown>,
  options: {
    duration?: number;
    delay?: number;
    easing?: string | number[];
  } = {}
): AnimationControls | null {
  if (!element) return null;

  return animate(element, keyframes as MotionKeyframesDefinition, {
    duration: options.duration ?? 0.3,
    delay: options.delay ?? 0,
    easing: options.easing ?? [0.25, 0.1, 0.25, 1],
  } as AnimationOptionsWithOverrides);
}

/**
 * Animate multiple elements with stagger.
 *
 * @example
 * ```tsx
 * animateStagger(
 *   document.querySelectorAll(".card"),
 *   { opacity: [0, 1], y: [20, 0] },
 *   { stagger: 0.1 }
 * );
 * ```
 */
export function animateStagger(
  elements: NodeListOf<Element> | Element[] | null,
  keyframes: Record<string, unknown>,
  options: {
    duration?: number;
    stagger?: number;
    easing?: string | number[];
  } = {}
): AnimationControls | null {
  if (!elements || (Array.isArray(elements) && elements.length === 0)) return null;

  return animate(elements, keyframes as MotionKeyframesDefinition, {
    duration: options.duration ?? 0.4,
    delay: stagger(options.stagger ?? 0.1),
    easing: options.easing ?? [0.25, 0.1, 0.25, 1],
  } as AnimationOptionsWithOverrides);
}

/**
 * Create a timeline of animations.
 *
 * @example
 * ```tsx
 * animateSequence([
 *   [headerRef, { opacity: [0, 1] }, { duration: 0.3 }],
 *   [contentRef, { opacity: [0, 1], y: [20, 0] }, { duration: 0.4, at: "-0.1" }],
 *   [footerRef, { opacity: [0, 1] }, { duration: 0.3, at: "-0.1" }],
 * ]);
 * ```
 */
export function animateSequence(
  sequence: Array<
    [Element | null, Record<string, unknown>, { duration?: number; at?: string | number }?]
  >
): AnimationControls {
  const validSequence = sequence
    .filter(([element]) => element !== null)
    .map(([element, keyframes, options]) => [
      element as Element,
      keyframes,
      options ?? {},
    ]);

  return timeline(validSequence as Parameters<typeof timeline>[0]);
}

// ============================================================================
// Micro-interaction Helpers
// ============================================================================

/**
 * Button press effect.
 */
export function buttonPress(element: Element | null): AnimationControls | null {
  if (!element) return null;

  return animate(
    element,
    { scale: [1, 0.97, 1] },
    { duration: 0.15, easing: [0.25, 0.1, 0.25, 1] }
  );
}

/**
 * Shake effect (for errors).
 */
export function shake(element: Element | null): AnimationControls | null {
  if (!element) return null;

  return animate(
    element,
    { x: [0, -8, 8, -8, 8, 0] },
    { duration: 0.4, easing: "ease-out" }
  );
}

/**
 * Pulse effect (for attention).
 */
export function pulse(element: Element | null): AnimationControls | null {
  if (!element) return null;

  return animate(
    element,
    { scale: [1, 1.05, 1] },
    { duration: 0.3, easing: [0.25, 0.1, 0.25, 1] }
  );
}

/**
 * Bounce effect (for success).
 */
export function bounce(element: Element | null): AnimationControls | null {
  if (!element) return null;

  return animate(
    element,
    { y: [0, -10, 0, -5, 0] },
    { duration: 0.5, easing: "ease-out" }
  );
}

/**
 * Spin effect (for loading).
 */
export function spin(element: Element | null, options: { duration?: number } = {}): AnimationControls | null {
  if (!element) return null;

  return animate(
    element,
    { rotate: [0, 360] },
    { duration: options.duration ?? 1, repeat: Infinity, easing: "linear" }
  );
}

/**
 * Highlight effect (flash background).
 */
export function highlight(
  element: Element | null,
  color: string = "rgba(0, 200, 180, 0.3)"
): AnimationControls | null {
  if (!element) return null;

  return animate(
    element,
    { backgroundColor: [color, "transparent"] },
    { duration: 0.6, easing: "ease-out" }
  );
}

// ============================================================================
// Spring Animations
// ============================================================================

/**
 * Spring animation helper.
 */
export const springs = {
  // Gentle spring (modals, overlays)
  gentle: spring({ stiffness: 200, damping: 20 }),

  // Bouncy spring (buttons, notifications)
  bouncy: spring({ stiffness: 400, damping: 25 }),

  // Snappy spring (toggles, switches)
  snappy: spring({ stiffness: 500, damping: 30 }),

  // Wobbly spring (playful elements)
  wobbly: spring({ stiffness: 300, damping: 15 }),
} as const;

// ============================================================================
// Transition Helpers
// ============================================================================

/**
 * Standard transition options.
 */
export const transitions = {
  fast: { duration: 0.15, easing: [0.25, 0.1, 0.25, 1] },
  normal: { duration: 0.3, easing: [0.25, 0.1, 0.25, 1] },
  slow: { duration: 0.5, easing: [0.25, 0.1, 0.25, 1] },
  spring: { easing: springs.bouncy },
} as const;

// Re-export motion utilities
export { animate, stagger, timeline, spring };
