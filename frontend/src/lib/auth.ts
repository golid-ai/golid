/**
 * Auth store
 * Manages user authentication state across the app
 *
 * Uses both:
 * - localStorage tokens (for API calls)
 * - Cookie (for SSR middleware auth checks)
 */

import { createSignal, createRoot } from "solid-js";
import { authApi, usersApi, tokens, type UserProfile } from "./api";

const AUTH_COOKIE_NAME = "app_authenticated";

function setAuthCookie(authenticated: boolean): void {
  if (typeof document === "undefined") return;

  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  if (authenticated) {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${AUTH_COOKIE_NAME}=true; path=/; expires=${expires}; SameSite=Lax${secure}`;
  } else {
    document.cookie = `${AUTH_COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax${secure}`;
  }
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

function createAuthStore() {
  const [state, setState] = createSignal<AuthState>({
    user: null,
    loading: false,
    initialized: false,
    error: null,
  });

  async function initialize(): Promise<void> {
    if (state().initialized) return;

    if (!tokens.access) {
      setAuthCookie(false);
      setState((s) => ({ ...s, initialized: true }));
      return;
    }

    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const user = await usersApi.me();
      setAuthCookie(true);
      setState({ user, loading: false, initialized: true, error: null });
    } catch {
      tokens.clear();
      setAuthCookie(false);
      setState({ user: null, loading: false, initialized: true, error: null });
    }
  }

  async function login(credentials: LoginCredentials): Promise<UserProfile> {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const response = await authApi.login(credentials.email, credentials.password);
      tokens.set(response.access_token!, response.refresh_token!);

      const user = await usersApi.me();
      setAuthCookie(true);
      setState({ user, loading: false, initialized: true, error: null });

      return user;
    } catch (error: unknown) {
      const message = (error as { message?: string })?.message || "Login failed";
      setAuthCookie(false);
      setState((s) => ({ ...s, loading: false, error: message }));
      throw error;
    }
  }

  async function signup(data: SignupData): Promise<UserProfile> {
    setState((s) => ({ ...s, loading: true, error: null }));

    try {
      const response = await authApi.register(data);
      tokens.set(response.access_token!, response.refresh_token!);

      const user = await usersApi.me();
      setAuthCookie(true);
      setState({ user, loading: false, initialized: true, error: null });

      return user;
    } catch (error: unknown) {
      const message = (error as { message?: string })?.message || "Signup failed";
      setAuthCookie(false);
      setState((s) => ({ ...s, loading: false, error: message }));
      throw error;
    }
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout();
    } catch {
      // Continue with local cleanup even if server call fails
    }
    tokens.clear();
    setAuthCookie(false);
    setState({ user: null, loading: false, initialized: true, error: null });
  }

  function updateUser(user: UserProfile): void {
    setState((s) => ({ ...s, user }));
  }

  function clearError(): void {
    setState((s) => ({ ...s, error: null }));
  }

  if (typeof window !== "undefined") {
    window.addEventListener("auth:session-expired", () => {
      setAuthCookie(false);
      setState({ user: null, loading: false, initialized: true, error: null });
    });
  }

  return {
    state,

    initialize,
    login,
    signup,
    logout,
    updateUser,
    clearError,

    get user() {
      return state().user;
    },
    get isAuthenticated() {
      return !!state().user;
    },
    get isAdmin() {
      return state().user?.type === "admin";
    },
    get loading() {
      return state().loading;
    },
    get initialized() {
      return state().initialized;
    },
    get error() {
      return state().error;
    },
  };
}

export const auth = createRoot(createAuthStore);

export type { User, UserProfile } from "./api";
