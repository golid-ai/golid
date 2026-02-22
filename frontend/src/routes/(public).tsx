import { RouteSectionProps, useLocation } from "@solidjs/router";
import { createMemo } from "solid-js";
import { cn } from "~/lib/utils";

/**
 * Public layout - no authentication required.
 * Full-bleed for the landing page ("/").
 * Constrained for auth/utility pages (login, signup, etc.).
 * Footer is rendered by the root layout in app.tsx.
 */
export default function PublicLayout(props: RouteSectionProps) {
  const location = useLocation();

  const isFullBleed = createMemo(() => location.pathname === "/");

  return (
    <div
      class={cn(
        "mx-auto w-full flex-1 flex flex-col",
        isFullBleed()
          ? "py-0 px-0 max-w-none"
          : "max-w-[1600px] px-4 sm:px-6 py-8"
      )}
    >
      {props.children}
    </div>
  );
}
