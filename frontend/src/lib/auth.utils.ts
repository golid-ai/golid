import type { User } from "./api";

export function parseAuthState(user: User | null) {
  return {
    isAuthenticated: !!user,
    isAdmin: user?.type === "admin",
    displayName: user
      ? [user.first_name, user.last_name].filter(Boolean).join(" ") || "Account"
      : "Account",
  };
}
