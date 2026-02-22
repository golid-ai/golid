/**
 * API client for Golid backend
 * Handles authentication, token refresh, and error handling
 */

// ============================================================================
// Types
// ============================================================================

export interface User {
  id: string;
  email: string;
  type: string;
  email_verified?: boolean;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  created_at?: string;
}

export type UserProfile = User;

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

// ============================================================================
// API Client Types
// ============================================================================

const API_BASE = import.meta.env.VITE_API_URL || "";
const API_VERSION = "v1";

const ACCESS_TOKEN_KEY = "app_access_token";
const REFRESH_TOKEN_KEY = "app_refresh_token";

export interface ApiError {
  message: string;
  code: string;
  status: number;
  details?: Record<string, string>;
}

export interface ApiResponse<T> {
  data: T;
  ok: true;
}

export interface ApiErrorResponse {
  error: ApiError;
  ok: false;
}

export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

/** Type guard for ApiError (thrown by request functions) */
export function isApiError(err: unknown): err is ApiError {
  return typeof err === "object" && err !== null && "message" in err && "status" in err;
}

/** Extract a user-friendly error message from any thrown error */
export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (isApiError(err)) return err.message;
  if (err instanceof Error) return err.message;
  return fallback;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  signal?: AbortSignal;
  _retried?: boolean;
}

// ============================================================================
// Token Management
// ============================================================================

export const tokens = {
  get access(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  get refresh(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  set(accessToken: string, refreshToken: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  get isAuthenticated(): boolean {
    return !!this.access;
  },
};

// ============================================================================
// Core API Function
// ============================================================================

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * Make an API request to the backend
 */
export async function api<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = "GET", body, headers = {}, skipAuth = false, signal } = options;

  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...headers,
  };

  if (!skipAuth && tokens.access) {
    requestHeaders["Authorization"] = `Bearer ${tokens.access}`;
  }

  const response = await fetch(`${API_BASE}/api/${API_VERSION}${endpoint}`, {
    method,
    headers: requestHeaders,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  if (response.status === 401 && !skipAuth) {
    if (!options._retried && tokens.refresh) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        return api(endpoint, { ...options, _retried: true });
      }
    }
    tokens.clear();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("auth:session-expired"));
    }
  }

  if (!response.ok) {
    const error = await parseError(response);
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing) {
    return refreshPromise!;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE}/api/${API_VERSION}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: tokens.refresh }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      tokens.set(data.access_token, data.refresh_token);
      return true;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function parseError(response: Response): Promise<ApiError> {
  const error: ApiError = {
    message: `Request failed: ${response.statusText}`,
    code: "unknown_error",
    status: response.status,
  };

  try {
    const text = await response.text();

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json") && text) {
      const data = JSON.parse(text);
      error.message = data.message || data.error || error.message;
      error.code = data.code || error.code;
      error.details = data.details;
    } else if (text.startsWith("<!DOCTYPE") || text.startsWith("<html")) {
      error.message = "Unable to reach the server. Please try again later.";
      error.code = "server_unreachable";
    }
  } catch {
    if (!response.statusText) {
      error.message = "Unable to reach the server. Please try again later.";
      error.code = "server_unreachable";
    }
  }

  return error;
}

// ============================================================================
// Convenience Methods
// ============================================================================

export const get = <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
  api<T>(endpoint, { ...options, method: "GET" });

export const post = <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
  api<T>(endpoint, { ...options, method: "POST", body });

export const put = <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
  api<T>(endpoint, { ...options, method: "PUT", body });

export const patch = <T>(endpoint: string, body?: unknown, options?: Omit<RequestOptions, "method" | "body">) =>
  api<T>(endpoint, { ...options, method: "PATCH", body });

export const del = <T>(endpoint: string, options?: Omit<RequestOptions, "method" | "body">) =>
  api<T>(endpoint, { ...options, method: "DELETE" });

// ============================================================================
// Auth API
// ============================================================================

export const authApi = {
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => post<AuthResponse>("/auth/register", data, { skipAuth: true }),

  login: (email: string, password: string) =>
    post<AuthResponse>("/auth/login", { email, password }, { skipAuth: true }),

  refresh: (refreshToken: string) =>
    post<AuthResponse>("/auth/refresh", { refresh_token: refreshToken }, { skipAuth: true }),

  logout: () => post<void>("/auth/logout"),

  forgotPassword: (email: string) =>
    post<{ message: string }>("/auth/forgot-password", { email }, { skipAuth: true }),

  verifyResetToken: (token: string) =>
    get<{ valid: boolean; email?: string }>(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`, { skipAuth: true }),

  resetPassword: (token: string, password: string) =>
    post<{ message: string }>("/auth/reset-password", { token, password }, { skipAuth: true }),

  verifyEmail: (token: string) =>
    get<{ message: string }>(`/auth/verify-email?token=${encodeURIComponent(token)}`, { skipAuth: true }),

  resendVerification: (email: string) =>
    post<{ message: string }>("/auth/resend-verification", { email }, { skipAuth: true }),

  changePassword: (currentPassword: string, newPassword: string) =>
    put<{ message: string }>("/auth/password", {
      current_password: currentPassword,
      new_password: newPassword,
    }),
};

// ============================================================================
// Users API
// ============================================================================

export const usersApi = {
  me: () => get<User>("/me"),

  updateProfile: (data: {
    first_name?: string;
    last_name?: string;
    avatar_url?: string | null;
  }) => put<User>("/me", data),
};
