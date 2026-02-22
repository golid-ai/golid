import { Title } from "@solidjs/meta";
import { A } from "@solidjs/router";
import { batch, createSignal, onCleanup, Show } from "solid-js";
import { Button, Input } from "~/components";
import { post } from "~/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [submitted, setSubmitted] = createSignal(false);
  const [error, setError] = createSignal("");

  let alive = true;
  onCleanup(() => { alive = false; });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await post("/auth/forgot-password", { email: email().toLowerCase().trim() }, { skipAuth: true });
      if (!alive) return;
      batch(() => {
        setSubmitted(true);
        setLoading(false);
      });
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
      <Title>Forgot Password | Golid</Title>

      <div class="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div class="w-full max-w-md bg-background/60 dark:bg-midnight/80 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg p-8 sm:p-10">
          <Show
            when={!submitted()}
            fallback={
              <div class="text-center">
                <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-cta-teal/10">
                  <span class="material-symbols-rounded text-3xl text-cta-teal">mail</span>
                </div>
                <h2 class="text-2xl font-bold font-montserrat text-foreground">Check your email</h2>
                <p class="mt-2 text-sm text-muted-foreground">
                  If an account exists with <strong class="text-foreground">{email()}</strong>, 
                  you will receive a password reset link shortly.
                </p>
                <A href="/login" class="mt-6 inline-block text-cta-teal hover:underline text-sm">
                  Back to login
                </A>
              </div>
            }
          >
            <div class="mb-6 text-center">
              <h2 class="text-2xl font-bold font-montserrat text-foreground">Forgot your password?</h2>
              <p class="mt-2 text-sm text-muted-foreground">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <Show when={error()}>
              <div class="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red/10 border border-red/20 text-red text-sm">
                <span class="material-symbols-rounded text-base">error</span>
                {error()}
              </div>
            </Show>

            <form onSubmit={handleSubmit} class="flex flex-col gap-3">
              <Input
                type="email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                placeholder="you@example.com"
                required
                class="h-11"
              />

              <Button type="submit" fullWidth loading={loading()} class="h-11 font-semibold">
                Send reset link
              </Button>
            </form>

            <p class="mt-4 text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <A href="/login" class="text-cta-teal hover:underline">
                Log in
              </A>
            </p>
          </Show>
        </div>
      </div>
    </>
  );
}
