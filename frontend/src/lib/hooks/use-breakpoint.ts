/**
 * Reactive breakpoint detection hook for SolidJS
 * Provides a shared way to detect viewport size across components
 */

import { createSignal, onMount, onCleanup } from "solid-js";

/**
 * Tailwind breakpoint values (in pixels)
 */
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

export type Breakpoint = keyof typeof breakpoints;

/**
 * Hook to detect if viewport is below a certain breakpoint
 *
 * @param breakpoint - The breakpoint to check against (default: 'lg')
 * @returns A signal that's true when viewport is below the breakpoint
 *
 * @example
 * ```tsx
 * const isMobile = useBreakpoint('lg'); // true when < 1024px
 * const isTablet = useBreakpoint('md'); // true when < 768px
 *
 * return (
 *   <Show when={isMobile()}>
 *     <MobileNav />
 *   </Show>
 * );
 * ```
 */
export function useBreakpoint(breakpoint: Breakpoint = "lg") {
  const [isBelow, setIsBelow] = createSignal(false);
  const threshold = breakpoints[breakpoint];

  onMount(() => {
    // Check immediately
    const check = () => setIsBelow(window.innerWidth < threshold);
    check();

    // Listen for resize
    window.addEventListener("resize", check);
    onCleanup(() => window.removeEventListener("resize", check));
  });

  return isBelow;
}

/**
 * Hook to get the current breakpoint name
 *
 * @returns A signal with the current breakpoint name
 *
 * @example
 * ```tsx
 * const bp = useCurrentBreakpoint();
 * console.log(bp()); // 'sm' | 'md' | 'lg' | 'xl' | '2xl'
 * ```
 */
export function useCurrentBreakpoint() {
  const [current, setCurrent] = createSignal<Breakpoint | "xs">("xs");

  onMount(() => {
    const check = () => {
      const width = window.innerWidth;
      if (width >= breakpoints["2xl"]) setCurrent("2xl");
      else if (width >= breakpoints.xl) setCurrent("xl");
      else if (width >= breakpoints.lg) setCurrent("lg");
      else if (width >= breakpoints.md) setCurrent("md");
      else if (width >= breakpoints.sm) setCurrent("sm");
      else setCurrent("xs");
    };
    check();

    window.addEventListener("resize", check);
    onCleanup(() => window.removeEventListener("resize", check));
  });

  return current;
}

/**
 * Convenience hooks for common breakpoints
 */
export const useIsMobile = () => useBreakpoint("lg");  // < 1024px
export const useIsTablet = () => useBreakpoint("md");  // < 768px
export const useIsSmall = () => useBreakpoint("sm");   // < 640px
