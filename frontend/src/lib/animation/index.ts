/**
 * Animation Module for Golid
 *
 * Provides two animation libraries:
 * - GSAP: For complex page-level animations, scroll triggers, and timelines
 * - Motion One: For component-level animations with a Framer Motion-like API
 *
 * @example
 * ```tsx
 * // GSAP for page animations
 * import { fadeInUp, staggerChildren, useAnimation } from "~/lib/animation";
 *
 * // Motion One for component animations
 * import { Motion, Presence, presets } from "~/lib/animation";
 * ```
 */

// GSAP exports
export {
  // Core animations
  fadeIn,
  fadeOut,
  fadeInUp,
  fadeInDown,
  fadeInLeft,
  fadeInRight,
  scaleIn,
  scaleOut,
  // Stagger animations
  staggerChildren,
  staggerList,
  // Timeline utilities
  createTimeline,
  pageEntrance,
  // SolidJS hooks
  useAnimation,
  useScrollAnimation,
  // Utilities
  killAnimations,
  setHidden,
  createAnimationContext,
  // Constants
  easings,
  defaults,
  // GSAP instance
  gsap,
} from "./gsap";

// Motion One exports
export {
  // Components
  Motion,
  Presence,
  // Presets
  presets,
  // Imperative functions
  animateElement,
  animateStagger,
  animateSequence,
  // Micro-interactions
  buttonPress,
  shake,
  pulse,
  bounce,
  spin,
  highlight,
  // Springs
  springs,
  // Transitions
  transitions,
  // Core motion functions
  animate,
  stagger,
  timeline,
  spring,
} from "./motion";
