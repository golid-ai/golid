import { Show } from "solid-js";
import { cn } from "~/lib/utils";

// =============================================================================
// TYPES
// =============================================================================

export interface FooterProps {
  class?: string;
  minimal?: boolean;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function Footer(props: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <Show
      when={!props.minimal}
      fallback={
        /* Minimal Footer for Private Pages */
        <footer
          class={cn(
            "mt-auto border-t border-foreground/5 bg-white/30 dark:bg-midnight/30 backdrop-blur-md py-4 px-6",
            props.class
          )}
        >
          <div class="flex items-center justify-center">
            <span class="text-xs text-muted-foreground/60">
              &copy; {currentYear} Golid. All Rights Reserved.
            </span>
          </div>
        </footer>
      }
    >
      {/* Full Footer for Public Pages */}
      <footer
        class={cn(
          "mt-auto border-t border-foreground/5 bg-white/30 dark:bg-midnight/30 backdrop-blur-md py-6",
          props.class
        )}
      >
        <div class="flex flex-col sm:flex-row items-center justify-between gap-4 max-w-[1600px] px-6 sm:px-24 mx-auto">
          {/* Left: Navigation */}
          <div class="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="/" class="hover:text-foreground transition-colors">Home</a>
            <a href="/login" class="hover:text-foreground transition-colors">Login</a>
            <a href="/signup" class="hover:text-foreground transition-colors">Sign Up</a>
          </div>

          {/* Right: Copyright */}
          <span class="text-xs text-muted-foreground/60">
            &copy; {currentYear} Golid. All Rights Reserved.
          </span>
        </div>
      </footer>
    </Show>
  );
}
