import { MetaProvider, Title, Meta } from "@solidjs/meta";
import { Router, useLocation } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, onMount, onCleanup, createEffect, createMemo, Show, ErrorBoundary, type JSX } from "solid-js";
import { Navbar, Sidebar, Footer } from "~/components/organisms";
import { Toaster, SnackbarManager, LoadingOverlay } from "~/components";
import { auth } from "~/lib/auth";
import { ui } from "~/lib/stores/ui";
import { connectSSE, disconnectSSE } from "~/lib/sse";
import { PRIVATE_ROUTES } from "~/lib/constants";
import {
  clearBuildReloadMarker,
  errorMessage,
  isChunkLoadError,
  reloadOnceForChunkError,
  reloadWithFreshBuild,
} from "~/lib/chunk-recovery";
import {
  OG_SITE_BASE,
  DEFAULT_OG_IMAGE_URL,
  DEFAULT_OG_TITLE,
  DEFAULT_OG_DESCRIPTION,
} from "~/lib/og-meta";
import "./app.css";

function PageErrorFallback(props: { err: unknown; reset: () => void }) {
  const chunkError = () => isChunkLoadError(props.err);

  return (
    <div class="flex-1 flex items-center justify-center p-8">
      <div class="max-w-md text-center space-y-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
          <span class="material-symbols-rounded text-3xl text-danger">error</span>
        </div>
        <h1 class="text-2xl font-bold text-foreground">Page error</h1>
        <p class="text-sm text-muted-foreground">
          {chunkError()
            ? "This page needs the latest app version. Reload to fetch the current build."
            : errorMessage(props.err) || "An unexpected error occurred."}
        </p>
        <button
          onClick={() => chunkError() ? reloadWithFreshBuild() : props.reset()}
          class="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          {chunkError() ? "Reload app" : "Try again"}
        </button>
      </div>
    </div>
  );
}

function AppErrorFallback(props: { err: unknown; reset: () => void }) {
  const chunkError = () => isChunkLoadError(props.err);

  return (
    <div class="min-h-screen bg-background flex items-center justify-center p-8">
      <div class="max-w-md text-center space-y-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
          <span class="material-symbols-rounded text-3xl text-danger">error</span>
        </div>
        <h1 class="text-2xl font-bold text-foreground">Something went wrong</h1>
        <p class="text-sm text-muted-foreground">
          {chunkError()
            ? "The app needs to load the latest build. Reload to continue."
            : errorMessage(props.err) || "An unexpected error occurred."}
        </p>
        <button
          onClick={() => chunkError() ? reloadWithFreshBuild() : props.reset()}
          class="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          {chunkError() ? "Reload app" : "Try again"}
        </button>
      </div>
    </div>
  );
}

function RootLayout(props: { children: JSX.Element }) {
  const location = useLocation();

  const isPrivate = createMemo(() =>
    PRIVATE_ROUTES.some((r) => {
      const pattern = new RegExp(`^${r}(?:/|$)`);
      return pattern.test(location.pathname);
    })
  );

  const showSidebar = createMemo(() => auth.isAuthenticated && isPrivate());

  const sidebarWidth = createMemo(() => {
    if (!showSidebar() || ui.subscribeMobile()) return "0px";
    return ui.subscribeSidebar() ? "80px" : "256px";
  });

  createEffect(() => {
    location.pathname;
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      document.getElementById("main-content")?.focus();
    }
  });

  const canonicalPageUrl = createMemo(() => `${OG_SITE_BASE}${location.pathname}`);

  onMount(() => {
    auth.initialize();
    clearBuildReloadMarker();

    const handlePreloadError = (event: Event) => {
      event.preventDefault();
      reloadOnceForChunkError();
    };
    if (import.meta.env.PROD) {
      window.addEventListener("vite:preloadError", handlePreloadError);
    }

    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024;
      if (isMobile !== ui.isMobile) {
        ui.setIsMobile(isMobile);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    onCleanup(() => {
      if (import.meta.env.PROD) {
        window.removeEventListener("vite:preloadError", handlePreloadError);
      }
      window.removeEventListener("resize", checkMobile);
    });
  });

  createEffect(() => {
    if (auth.isAuthenticated) {
      connectSSE();
    } else {
      disconnectSSE();
    }
  });

  onCleanup(() => {
    disconnectSSE();
  });

  return (
    <MetaProvider>
      <Title>{DEFAULT_OG_TITLE}</Title>
      <Meta property="og:site_name" content="Golid" />
      <Meta property="og:title" content={DEFAULT_OG_TITLE} />
      <Meta property="og:description" content={DEFAULT_OG_DESCRIPTION} />
      <Meta property="og:image" content={DEFAULT_OG_IMAGE_URL} />
      <Meta property="og:url" content={canonicalPageUrl()} />
      <Meta property="og:type" content="website" />
      <Meta name="twitter:card" content="summary" />
      <Meta name="twitter:title" content={DEFAULT_OG_TITLE} />
      <Meta name="twitter:description" content={DEFAULT_OG_DESCRIPTION} />
      <Meta name="twitter:image" content={DEFAULT_OG_IMAGE_URL} />

      <div class="relative flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden">
        <a href="#main-content" class="skip-link">Skip to main content</a>

        <Show when={import.meta.env.VITE_DEMO_MODE === "true"}>
          <div class="bg-primary text-primary-foreground text-center text-sm py-2 px-4 font-medium z-50">
            Live demo — Data resets hourly. Accounts: admin@example.com / user@example.com (Password123!)
          </div>
        </Show>

        <Navbar
          showMenuButton={ui.subscribeMobile() && isPrivate()}
          onMenuToggle={() => ui.toggleSidebar()}
        />

        <Show when={showSidebar()}>
          <Sidebar
            collapsed={ui.subscribeSidebar()}
            onToggle={() => ui.toggleSidebar()}
          />
        </Show>

        <Suspense fallback={<div class="min-h-screen bg-background" />}>
          <main
            id="main-content"
            tabindex="-1"
            class="flex flex-1 flex-col outline-none min-w-0 overflow-hidden transition-all duration-300 pt-16"
            style={{ "margin-left": sidebarWidth() }}
          >
            <ErrorBoundary fallback={(err, reset) => <PageErrorFallback err={err} reset={reset} />}>
              <div class="w-full flex-1 flex flex-col">
                {props.children}
              </div>
            </ErrorBoundary>
            <Footer minimal={isPrivate()} />
          </main>
        </Suspense>
      </div>

      <Toaster />
      <SnackbarManager />
      <LoadingOverlay />
    </MetaProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallback={(err, reset) => <AppErrorFallback err={err} reset={reset} />}>
      <Router root={(props) => <RootLayout>{props.children}</RootLayout>}>
        <FileRoutes />
      </Router>
    </ErrorBoundary>
  );
}
