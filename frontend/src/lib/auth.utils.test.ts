import { describe, it, expect } from "vitest";
import { parseAuthState } from "./auth.utils";
import type { User } from "./api";

const testUser: User = {
  id: "123",
  email: "test@example.com",
  type: "user",
  first_name: "John",
  last_name: "Doe",
};

describe("parseAuthState", () => {
  it("returns unauthenticated for null user", () => {
    const state = parseAuthState(null);
    expect(state.isAuthenticated).toBe(false);
    expect(state.isAdmin).toBe(false);
    expect(state.displayName).toBe("Account");
  });

  it("returns authenticated for valid user", () => {
    const state = parseAuthState(testUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isAdmin).toBe(false);
    expect(state.displayName).toBe("John Doe");
  });

  it("detects admin user", () => {
    const admin = { ...testUser, type: "admin" };
    const state = parseAuthState(admin);
    expect(state.isAdmin).toBe(true);
  });

  it("handles missing first_name", () => {
    const user = { ...testUser, first_name: undefined };
    const state = parseAuthState(user);
    expect(state.displayName).toBe("Doe");
  });

  it("handles missing both names", () => {
    const user = { ...testUser, first_name: undefined, last_name: undefined };
    const state = parseAuthState(user);
    expect(state.displayName).toBe("Account");
  });

  it("handles empty string names", () => {
    const user = { ...testUser, first_name: "", last_name: "" };
    const state = parseAuthState(user);
    expect(state.displayName).toBe("Account");
  });
});
