import { Title } from "@solidjs/meta";
import { A, useNavigate } from "@solidjs/router";
import { batch, createSignal, createMemo, onCleanup, Show } from "solid-js";
import { Button, Input } from "~/components";
import { PasswordInput } from "~/components/molecules/PasswordInput/PasswordInput";
import { auth } from "~/lib/auth";
import { Icon } from "~/components/atoms/Icon";

export default function Signup() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = createSignal("");
  const [lastName, setLastName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");

  const [error, setError] = createSignal("");
  const [loading, setLoading] = createSignal(false);

  const [emailTouched, setEmailTouched] = createSignal(false);
  const [passwordTouched, setPasswordTouched] = createSignal(false);
  const [confirmTouched, setConfirmTouched] = createSignal(false);

  const emailValid = createMemo(() => {
    const e = email();
    return e.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  });

  const passwordValid = createMemo(() => password().length >= 8);
  const confirmValid = createMemo(() => confirmPassword().length > 0 && password() === confirmPassword());

  let alive = true;
  onCleanup(() => { alive = false; });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await auth.signup({
        email: email().toLowerCase().trim(),
        password: password(),
        first_name: firstName().trim(),
        last_name: lastName().trim(),
      });
      if (!alive) return;
      batch(() => {
        setLoading(false);
      });
      navigate("/dashboard");
    } catch (err: unknown) {
      if (!alive) return;
      const apiError = err as { message?: string };
      batch(() => {
        setError(apiError.message ?? "Registration failed");
        setLoading(false);
      });
    }
  }

  return (
    <>
      <Title>Sign Up | Golid</Title>
      <div class="flex-1 flex flex-col items-center py-8 px-4">
        <div class="w-full max-w-lg">
          <div class="text-center mb-8">
            <h1 class="text-3xl font-bold font-montserrat text-foreground mb-2">
              Create Your Account
            </h1>
            <p class="text-sm text-muted-foreground">
              Get started in seconds
            </p>
          </div>

          <form onSubmit={handleSubmit} class="flex flex-col gap-5">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-semibold text-foreground mb-1.5 block">First Name</label>
                <Input
                  value={firstName()}
                  onInput={(e) => setFirstName(e.currentTarget.value)}
                  placeholder="John"
                  required
                  class="h-11"
                />
              </div>
              <div>
                <label class="text-sm font-semibold text-foreground mb-1.5 block">Last Name</label>
                <Input
                  value={lastName()}
                  onInput={(e) => setLastName(e.currentTarget.value)}
                  placeholder="Doe"
                  required
                  class="h-11"
                />
              </div>
            </div>

            <div>
              <label class="text-sm font-semibold text-foreground mb-1.5 block">Email</label>
              <Input
                type="text"
                inputmode="email"
                autocomplete="email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                onBlur={() => setEmailTouched(true)}
                placeholder="you@example.com"
                required
                class="h-11"
                variant={emailTouched() && !emailValid() && email().length > 0 ? "error" : "default"}
              />
              <Show when={emailTouched() && emailValid()}>
                <p class="flex items-center gap-1.5 mt-1.5 text-xs text-cta-green font-medium">
                  <Icon name="check_circle" size={14} class="text-cta-green" />
                  Valid email address
                </p>
              </Show>
            </div>

            <div>
              <label class="text-sm font-semibold text-foreground mb-1.5 block">Password</label>
              <PasswordInput
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                onBlur={() => setPasswordTouched(true)}
                placeholder="Create a password"
                required
                class="h-11"
              />
              <Show when={passwordTouched() && passwordValid()}>
                <p class="flex items-center gap-1.5 mt-1.5 text-xs text-cta-green font-medium">
                  <Icon name="check_circle" size={14} class="text-cta-green" />
                  Password meets requirements
                </p>
              </Show>
            </div>

            <div>
              <label class="text-sm font-semibold text-foreground mb-1.5 block">Confirm Password</label>
              <PasswordInput
                value={confirmPassword()}
                onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                onBlur={() => setConfirmTouched(true)}
                placeholder="Confirm your password"
                required
                class="h-11"
                variant={confirmTouched() && !confirmValid() && confirmPassword().length > 0 ? "error" : "default"}
              />
            </div>

            <Show when={error()}>
              <div class="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red/10 border border-red/20 text-red text-sm">
                <span class="material-symbols-rounded text-base">error</span>
                {error()}
              </div>
            </Show>

            <Button
              type="submit"
              fullWidth
              class="h-12 font-semibold text-base"
              loading={loading()}
              disabled={!firstName().trim() || !lastName().trim() || !emailValid() || !passwordValid() || !confirmValid()}
            >
              Create Account
            </Button>
          </form>

          <div class="mt-6 text-center text-sm text-muted-foreground">
            Already have an account? <A href="/login" class="text-cta-teal hover:underline">Sign in</A>
          </div>
        </div>
      </div>
    </>
  );
}
