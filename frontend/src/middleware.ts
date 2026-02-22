/**
 * SolidStart Middleware
 * Handles server-side authentication redirects
 * 
 * This runs BEFORE any page renders, so unauthenticated users
 * never receive private page bundles.
 */

import { createMiddleware } from "@solidjs/start/middleware";
import { redirect } from "@solidjs/router";
import { PRIVATE_ROUTES, AUTH_ROUTES } from "~/lib/constants";

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export default createMiddleware({
  async onRequest(event) {
    const { request } = event;
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Get auth cookie (set by client after login)
    const cookies = request.headers.get("cookie") || "";
    const hasAuthCookie = cookies.includes("app_authenticated=true");

    // Check if this is a private route (exact match or subpath only)
    // Uses regex to avoid /profile matching /profile-external
    const isPrivateRoute = PRIVATE_ROUTES.some(route => {
      const pattern = new RegExp(`^${escapeRegExp(route)}(?:/|$)`);
      return pattern.test(pathname);
    });

    // Check if this is an auth route (login/signup)
    const isAuthRoute = AUTH_ROUTES.some(route => {
      const pattern = new RegExp(`^${escapeRegExp(route)}(?:/|$)`);
      return pattern.test(pathname);
    });

    // Redirect unauthenticated users away from private routes
    if (isPrivateRoute && !hasAuthCookie) {
      const redirectTo = encodeURIComponent(pathname);
      return redirect(`/login?redirectTo=${redirectTo}`);
    }

    // Redirect authenticated users away from auth routes
    if (isAuthRoute && hasAuthCookie) {
      return redirect("/dashboard");
    }
  },
});
