import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./api", () => {
  const mockTokens = { access: "", refresh: "", set: vi.fn(), clear: vi.fn() };
  return {
    authApi: {
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    },
    usersApi: {
      me: vi.fn(),
    },
    tokens: mockTokens,
  };
});

import { auth } from "./auth";
import { authApi, usersApi, tokens } from "./api";

const mockLogin = vi.mocked(authApi.login);
const mockRegister = vi.mocked(authApi.register);
const mockLogout = vi.mocked(authApi.logout);
const mockMe = vi.mocked(usersApi.me);
const mockTokens = tokens as any;

describe("auth store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTokens.access = "";
    mockTokens.refresh = "";
  });

  describe("initial state", () => {
    it("is not authenticated without tokens", () => {
      expect(auth.isAuthenticated).toBe(false);
    });

    it("isAdmin returns false without user", () => {
      expect(auth.isAdmin).toBe(false);
    });

    it("has no error initially", () => {
      auth.clearError();
      expect(auth.error).toBeNull();
    });
  });

  describe("login", () => {
    it("sets user on successful login", async () => {
      const mockUser = { id: "1", email: "test@example.com", first_name: "Test", type: "user" };
      mockLogin.mockResolvedValueOnce({ access_token: "at", refresh_token: "rt" } as any);
      mockMe.mockResolvedValueOnce(mockUser as any);

      const userPromise = auth.login({ email: "test@example.com", password: "pass123" });
      expect(auth.loading).toBe(true);
      const user = await userPromise;

      expect(mockLogin).toHaveBeenCalledWith("test@example.com", "pass123");
      expect(mockTokens.set).toHaveBeenCalledWith("at", "rt");
      expect(user.email).toBe("test@example.com");
      expect(auth.loading).toBe(false);
    });

    it("throws and sets error on failed login", async () => {
      mockLogin.mockRejectedValueOnce({ message: "Invalid credentials" });

      await expect(auth.login({ email: "bad@test.com", password: "wrong" }))
        .rejects.toEqual({ message: "Invalid credentials" });
      expect(auth.error).toBe("Invalid credentials");
    });

    it("uses default error message when none provided", async () => {
      mockLogin.mockRejectedValueOnce({});

      await expect(auth.login({ email: "a@b.com", password: "x" })).rejects.toBeDefined();
      expect(auth.error).toBe("Login failed");
    });
  });

  describe("signup", () => {
    it("registers and sets user", async () => {
      const mockUser = { id: "2", email: "new@example.com", first_name: "New", type: "user" };
      mockRegister.mockResolvedValueOnce({ access_token: "at2", refresh_token: "rt2" } as any);
      mockMe.mockResolvedValueOnce(mockUser as any);

      const user = await auth.signup({
        email: "new@example.com", password: "pass123",
        first_name: "New", last_name: "User",
      });

      expect(user.email).toBe("new@example.com");
      expect(mockTokens.set).toHaveBeenCalledWith("at2", "rt2");
    });

    it("throws and sets error on failed signup", async () => {
      mockRegister.mockRejectedValueOnce({ message: "Email taken" });

      await expect(auth.signup({
        email: "taken@test.com", password: "pass",
        first_name: "A", last_name: "B",
      })).rejects.toBeDefined();
      expect(auth.error).toBe("Email taken");
    });

    it("uses default error message when none provided", async () => {
      mockRegister.mockRejectedValueOnce({});

      await expect(auth.signup({
        email: "x@y.com", password: "pass12345",
        first_name: "A", last_name: "B",
      })).rejects.toBeDefined();
      expect(auth.error).toBe("Signup failed");
    });
  });

  describe("initialize", () => {
    it("skips re-fetch when already initialized", async () => {
      mockMe.mockClear();
      await auth.initialize();
      const callsBefore = mockMe.mock.calls.length;
      mockTokens.access = "another-token";
      await auth.initialize();
      expect(mockMe.mock.calls.length).toBe(callsBefore);
    });
  });

  describe("logout", () => {
    it("clears tokens and user state", async () => {
      mockLogout.mockResolvedValueOnce(undefined as any);
      await auth.logout();
      expect(mockTokens.clear).toHaveBeenCalled();
      expect(auth.user).toBeNull();
      expect(auth.isAuthenticated).toBe(false);
    });

    it("clears state even if server call fails", async () => {
      mockLogout.mockRejectedValueOnce(new Error("network error"));
      await auth.logout();
      expect(mockTokens.clear).toHaveBeenCalled();
      expect(auth.user).toBeNull();
    });
  });

  describe("getters", () => {
    it("isAdmin returns true for admin user", () => {
      auth.updateUser({ id: "1", email: "a@test.com", type: "admin" } as any);
      expect(auth.isAdmin).toBe(true);
      expect(auth.isAuthenticated).toBe(true);
    });

    it("isAdmin returns false for regular user", () => {
      auth.updateUser({ id: "1", email: "u@test.com", type: "user" } as any);
      expect(auth.isAdmin).toBe(false);
    });

    it("clears user on auth:session-expired event", () => {
      auth.updateUser({ id: "1", email: "u@test.com", type: "user" } as any);
      window.dispatchEvent(new Event("auth:session-expired"));
      expect(auth.user).toBeNull();
      expect(auth.initialized).toBe(true);
    });
  });

  describe("updateUser", () => {
    it("updates user in state", () => {
      const user = { id: "1", email: "u@test.com", first_name: "U", type: "user" } as any;
      auth.updateUser(user);
      expect(auth.user?.email).toBe("u@test.com");
    });
  });

  describe("clearError", () => {
    it("clears error state", () => {
      auth.clearError();
      expect(auth.error).toBeNull();
    });
  });
});
