import { Title } from "@solidjs/meta";
import { A, useSearchParams } from "@solidjs/router";
import { batch, createSignal, onMount, onCleanup, Switch, Match } from "solid-js";
import { get } from "~/lib/api";

type VerificationState = "loading" | "success" | "error" | "no-token";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [state, setState] = createSignal<VerificationState>("loading");
  const [errorMessage, setErrorMessage] = createSignal("");

  const token = () => searchParams.token || "";

  let alive = true;
  onCleanup(() => { alive = false; });

  onMount(async () => {
    if (!token()) {
      setState("no-token");
      return;
    }

    try {
      await get(`/auth/verify-email?token=${encodeURIComponent(String(token()))}`, { skipAuth: true });
      if (!alive) return;
      batch(() => {
        setState("success");
      });
    } catch (err: unknown) {
      if (!alive) return;
      const apiError = err as { message?: string };
      batch(() => {
        setErrorMessage(apiError.message ?? "Failed to verify email");
        setState("error");
      });
    }
  });

  return (
    <>
      <Title>Verify Email | Golid</Title>

      <div class="w-full max-w-md">
        <Switch>
          <Match when={state() === "loading"}>
            <div class="text-center" aria-live="polite" aria-busy="true">
              <div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <h2 class="text-2xl font-bold text-foreground">Verifying your email...</h2>
              <p class="mt-2 text-muted-foreground">Please wait while we verify your email address.</p>
            </div>
          </Match>

          <Match when={state() === "success"}>
            <div class="text-center">
              <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <svg class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-foreground">Email Verified!</h2>
              <p class="mt-2 text-muted-foreground">
                Your email has been successfully verified. You can now access all features.
              </p>
              <A
                href="/login"
                class="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Continue to login
              </A>
            </div>
          </Match>

          <Match when={state() === "error"}>
            <div class="text-center">
              <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <svg class="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-foreground">Verification Failed</h2>
              <p class="mt-2 text-muted-foreground">
                {errorMessage() || "The verification link is invalid or has expired."}
              </p>
              <div class="mt-6 space-y-3">
                <A href="/login" class="block text-primary hover:text-primary/80">Go to login</A>
                <p class="text-sm text-muted-foreground">
                  Need a new verification email?{" "}
                  <A href="/login" class="text-primary hover:text-primary/80">Log in and request one</A>
                </p>
              </div>
            </div>
          </Match>

          <Match when={state() === "no-token"}>
            <div class="text-center">
              <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <svg class="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-foreground">Check Your Email</h2>
              <p class="mt-2 text-muted-foreground">
                Please click the verification link in the email we sent you to verify your account.
              </p>
              <A href="/login" class="mt-6 inline-block text-primary hover:text-primary/80">Back to login</A>
            </div>
          </Match>
        </Switch>
      </div>
    </>
  );
}
