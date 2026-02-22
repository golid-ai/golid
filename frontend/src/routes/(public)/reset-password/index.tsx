import { Title } from "@solidjs/meta";
import { A, useSearchParams, useNavigate } from "@solidjs/router";
import { batch, createSignal, createMemo, onMount, onCleanup, Switch, Match, Show } from "solid-js";
import { Button, Input } from "~/components";
import { get, post } from "~/lib/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [validating, setValidating] = createSignal(true);
  const [tokenValid, setTokenValid] = createSignal(false);
  const [email, setEmail] = createSignal("");
  const [error, setError] = createSignal("");
  const [success, setSuccess] = createSignal(false);

  const token = () => searchParams.token || "";

  type PageState = "validating" | "no-token" | "expired" | "success" | "form";
  const pageState = createMemo<PageState>(() => {
    if (validating()) return "validating";
    if (!token()) return "no-token";
    if (!tokenValid()) return "expired";
    if (success()) return "success";
    return "form";
  });

  let alive = true;
  onCleanup(() => { alive = false; });

  onMount(async () => {
    if (!token()) {
      setValidating(false);
      return;
    }

    try {
      const tokenValue = token();
      const data = await get<{ valid: boolean; email?: string }>(`/auth/verify-reset-token?token=${encodeURIComponent(String(tokenValue))}`, { skipAuth: true });
      if (!alive) return;
      batch(() => {
        if (data.valid) {
          setTokenValid(true);
          setEmail(data.email || "");
        }
        setValidating(false);
      });
    } catch {
      if (!alive) return;
      batch(() => {
        setValidating(false);
      });
    }
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setError("");

    if (password() !== confirmPassword()) {
      setError("Passwords do not match");
      return;
    }

    if (password().length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await post("/auth/reset-password", { token: token(), password: password() }, { skipAuth: true });
      if (!alive) return;
      batch(() => {
        setSuccess(true);
        setLoading(false);
      });

      setTimeout(() => {
        if (!alive) return;
        navigate("/login");
      }, 3000);
    } catch (err: unknown) {
      if (!alive) return;
      const apiError = err as { message?: string };
      batch(() => {
        setError(apiError.message ?? "Something went wrong. Please try again.");
        setLoading(false);
      });
    }
  }

  return (
    <>
      <Title>Reset Password | Golid</Title>

      <div class="w-full max-w-md">
        <Switch>
          <Match when={pageState() === "validating"}>
            <div class="text-center" aria-live="polite" aria-busy="true">
              <div class="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p class="text-muted-foreground">Validating reset link...</p>
            </div>
          </Match>

          <Match when={pageState() === "no-token"}>
            <div class="text-center">
              <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <svg class="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-foreground">Invalid Reset Link</h2>
              <p class="mt-2 text-muted-foreground">
                This password reset link is missing or invalid.
              </p>
              <A href="/forgot-password" class="mt-6 inline-block text-primary hover:text-primary/80">
                Request a new reset link
              </A>
            </div>
          </Match>

          <Match when={pageState() === "expired"}>
            <div class="text-center">
              <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <svg class="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-foreground">Link Expired</h2>
              <p class="mt-2 text-muted-foreground">
                This password reset link has expired. Reset links are valid for 1 hour.
              </p>
              <A href="/forgot-password" class="mt-6 inline-block text-primary hover:text-primary/80">
                Request a new reset link
              </A>
            </div>
          </Match>

          <Match when={pageState() === "success"}>
            <div class="text-center">
              <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <svg class="h-8 w-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-foreground">Password Reset!</h2>
              <p class="mt-2 text-muted-foreground">
                Your password has been successfully reset. Redirecting to login...
              </p>
              <A href="/login" class="mt-6 inline-block text-primary hover:text-primary/80">
                Go to login now
              </A>
            </div>
          </Match>

          <Match when={pageState() === "form"}>
            <div class="mb-8 text-center">
              <h2 class="text-2xl font-bold text-foreground">Reset your password</h2>
              <Show when={email()}>
                <p class="mt-2 text-sm text-muted-foreground">
                  Enter a new password for <strong class="text-foreground">{email()}</strong>
                </p>
              </Show>
            </div>

            <Show when={error()}>
              <div class="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error()}
              </div>
            </Show>

            <form onSubmit={handleSubmit} class="space-y-6">
              <Input
                label="New password"
                type="password"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                placeholder="••••••••"
                required
              />

              <Input
                label="Confirm new password"
                type="password"
                value={confirmPassword()}
                onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                placeholder="••••••••"
                required
              />

              <Button type="submit" fullWidth loading={loading()} size="lg">
                Reset password
              </Button>
            </form>
          </Match>
        </Switch>
      </div>
    </>
  );
}
