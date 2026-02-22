import { RouteSectionProps, useNavigate, useLocation } from "@solidjs/router";
import { createEffect, on, Show } from "solid-js";
import { auth } from "~/lib/auth";

/**
 * Private layout - authentication required.
 *
 * SSR: Middleware handles redirect before page loads (production)
 * SPA: Client-side effect handles navigation (dev + client nav)
 */
export default function PrivateLayout(props: RouteSectionProps) {
  const navigate = useNavigate();
  const location = useLocation();

  createEffect(on(
    () => [auth.initialized, auth.isAuthenticated] as const,
    ([initialized, authenticated]) => {
      if (initialized && !authenticated) {
        const path = encodeURIComponent(location.pathname);
        navigate(`/login?redirectTo=${path}`, { replace: true });
      }
    }
  ));

  return (
    <Show
      when={auth.initialized && auth.isAuthenticated}
      fallback={
        <div class="min-h-screen bg-background flex items-center justify-center" aria-live="polite" aria-busy="true">
          <div class="animate-spin rounded-full h-8 w-8 border-2 border-green border-t-transparent" role="status" />
          <span class="sr-only">Loading...</span>
        </div>
      }
    >
      {props.children}
    </Show>
  );
}
