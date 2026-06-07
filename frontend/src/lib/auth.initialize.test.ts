import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockTokens, mockMe } = vi.hoisted(() => ({
  mockTokens: { access: "", refresh: "", set: vi.fn(), clear: vi.fn() },
  mockMe: vi.fn(),
}));

vi.mock("./api", () => ({
  authApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
  usersApi: { me: (...args: unknown[]) => mockMe(...args) },
  tokens: mockTokens,
}));

describe("auth initialize (fresh store)", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    mockTokens.access = "";
  });

  it("marks initialized without token", async () => {
    const { auth } = await import("./auth");
    await auth.initialize();
    expect(auth.initialized).toBe(true);
    expect(auth.user).toBeNull();
  });

  it("loads user when token exists", async () => {
    mockTokens.access = "existing-token";
    mockMe.mockResolvedValueOnce({
      id: "1",
      email: "u@test.com",
      first_name: "U",
      type: "user",
    });

    const { auth } = await import("./auth");
    await auth.initialize();

    expect(mockMe).toHaveBeenCalled();
    expect(auth.user?.email).toBe("u@test.com");
    expect(auth.initialized).toBe(true);
  });

  it("clears tokens when me() fails", async () => {
    mockTokens.access = "stale-token";
    mockMe.mockRejectedValueOnce(new Error("Unauthorized"));

    const { auth } = await import("./auth");
    await auth.initialize();

    expect(mockTokens.clear).toHaveBeenCalled();
    expect(auth.user).toBeNull();
    expect(auth.initialized).toBe(true);
  });
});
