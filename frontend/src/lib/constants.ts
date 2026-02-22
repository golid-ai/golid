/**
 * Shared Constants
 * Used by middleware, navigation, and route guards
 */

// Routes that require authentication
export const PRIVATE_ROUTES = [
  "/dashboard",
  "/settings",
  "/components",
] as const;

// Routes that redirect to dashboard if already authenticated
export const AUTH_ROUTES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
] as const;

// Public routes (no auth required, no redirect if authenticated)
export const PUBLIC_ROUTES = [
  "/",
  "/verify-email",
] as const;

// Type helpers
export type PrivateRoute = (typeof PRIVATE_ROUTES)[number];
export type AuthRoute = (typeof AUTH_ROUTES)[number];
export type PublicRoute = (typeof PUBLIC_ROUTES)[number];
