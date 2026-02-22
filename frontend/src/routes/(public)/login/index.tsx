import { Title } from "@solidjs/meta";
import { A, useNavigate, useSearchParams } from "@solidjs/router";
import { batch, createSignal, onCleanup, Show } from "solid-js";
import { Button, Input } from "~/components";
import { PasswordInput } from "~/components/molecules/PasswordInput/PasswordInput";
import { auth } from "~/lib/auth";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  let alive = true;
  onCleanup(() => { alive = false; });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await auth.login({ email: email().toLowerCase().trim(), password: password() });
      if (!alive) return;
      batch(() => {
        setLoading(false);
      });
      const returnParam = searchParams.redirectTo;
      const returnUrl = returnParam ? decodeURIComponent(Array.isArray(returnParam) ? returnParam[0] : returnParam) : "/dashboard";
      navigate(returnUrl);
    } catch (err: unknown) {
      if (!alive) return;
      const apiError = err as { message?: string };
      batch(() => {
        setError(apiError.message ?? "Invalid email or password");
        setLoading(false);
      });
    }
  }

  return (
    <>
      <Title>Login | Golid</Title>
      <div class="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div class="flex flex-col sm:flex-row items-center sm:items-stretch gap-6 sm:gap-0 w-full max-w-[760px] bg-background/60 dark:bg-midnight/80 backdrop-blur-xl border border-foreground/10 rounded-2xl shadow-lg overflow-hidden">

          {/* Left: Branding */}
          <div class="relative flex flex-col justify-center items-center gap-5 p-8 sm:py-10 sm:px-10 sm:min-w-[220px]">
            <div class="absolute inset-0 bg-gradient-to-br from-cta-teal/[0.03] via-transparent to-cta-blue/[0.03]" />
            <div class="relative flex flex-col items-center gap-3">
              <a href="/" class="outline-none group">
                <span class="text-2xl font-bold font-montserrat text-midnight dark:text-mist group-hover:text-cta-green transition-colors duration-300">
                  Golid
                </span>
              </a>
            </div>
          </div>

          {/* Gradient Divider */}
          <div class="w-full h-px sm:w-px sm:h-auto bg-gradient-to-r sm:bg-gradient-to-b from-cta-teal/20 via-cta-blue/30 to-cta-violet/20" />

          {/* Right: Form */}
          <div class="flex-1 flex flex-col justify-center w-full p-6 sm:py-10 sm:px-10">
            <div class="mb-5">
              <h1 class="text-2xl font-bold font-montserrat text-foreground mb-1">Welcome back</h1>
              <p class="text-sm text-muted-foreground">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit} class="flex flex-col gap-3">
              <Input
                type="email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                placeholder="Email"
                required
                class="h-11"
              />
              <PasswordInput
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                placeholder="Password"
                required
                class="h-11"
              />

              <Show when={error()}>
                <div class="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red/10 border border-red/20 text-red text-sm">
                  <span class="material-symbols-rounded text-base">error</span>
                  {error()}
                </div>
              </Show>

              <Button type="submit" fullWidth class="h-11 font-semibold" loading={loading()}>
                Sign in
              </Button>
            </form>

            <div class="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <A href="/forgot-password" class="text-cta-teal hover:underline">Forgot password?</A>
              <span class="opacity-50">·</span>
              <span>No account? <A href="/signup" class="text-cta-teal hover:underline">Create one</A></span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
