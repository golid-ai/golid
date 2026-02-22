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
import "./app.css";

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
    window.scrollTo(0, 0);
    document.getElementById("main-content")?.focus();
  });

  onMount(() => {
    auth.initialize();

    const checkMobile = () => {
      const isMobile = window.innerWidth < 1024;
      if (isMobile !== ui.isMobile) {
        ui.setIsMobile(isMobile);
      }
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    onCleanup(() => window.removeEventListener("resize", checkMobile));
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
      <Title>Golid</Title>
      <Meta property="og:title" content="Golid" />
      <Meta property="og:description" content="Production-ready Go + SolidJS framework. Auth, 70+ components, SSR, real-time events, and one-command deployment." />
      <Meta property="og:image" content="/images/golid-og.png" />
      <Meta property="og:type" content="website" />
      <Meta name="twitter:card" content="summary" />
      <Meta name="twitter:image" content="/images/golid-og.png" />

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
            <ErrorBoundary
              fallback={(err, reset) => (
                <div class="flex-1 flex items-center justify-center p-8">
                  <div class="max-w-md text-center space-y-4">
                    <div class="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
                      <span class="material-symbols-rounded text-3xl text-danger">error</span>
                    </div>
                    <h1 class="text-2xl font-bold text-foreground">Page error</h1>
                    <p class="text-sm text-muted-foreground">{err?.message || "An unexpected error occurred."}</p>
                    <button
                      onClick={reset}
                      class="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}
            >
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
    <ErrorBoundary
      fallback={(err, reset) => (
        <div class="min-h-screen bg-background flex items-center justify-center p-8">
          <div class="max-w-md text-center space-y-4">
            <div class="w-16 h-16 mx-auto rounded-full bg-danger/10 flex items-center justify-center">
              <span class="material-symbols-rounded text-3xl text-danger">error</span>
            </div>
            <h1 class="text-2xl font-bold text-foreground">Something went wrong</h1>
            <p class="text-sm text-muted-foreground">{err?.message || "An unexpected error occurred."}</p>
            <button
              onClick={reset}
              class="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    >
      <Router root={(props) => <RootLayout>{props.children}</RootLayout>}>
        <FileRoutes />
      </Router>
    </ErrorBoundary>
  );
}
