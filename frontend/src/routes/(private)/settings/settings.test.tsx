import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { MetaProvider } from "@solidjs/meta";

// Mock dependencies before importing the component
const mockUpdateProfile = vi.fn();
const mockChangePassword = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock("~/lib/api", () => ({
  usersApi: { updateProfile: (...args: any[]) => mockUpdateProfile(...args) },
  authApi: { changePassword: (...args: any[]) => mockChangePassword(...args) },
  getErrorMessage: (err: any) => err?.message || "Something went wrong",
}));

vi.mock("~/lib/auth", () => ({
  auth: {
    user: {
      first_name: "Test",
      last_name: "User",
      email: "test@example.com",
      type: "user",
      email_verified: true,
    },
    updateUser: (...args: any[]) => mockUpdateUser(...args),
  },
}));

vi.mock("~/lib/stores", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    push: vi.fn(),
  },
}));

import Settings from "./index";

describe("Settings Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSettings = () => render(() => <MetaProvider><Settings /></MetaProvider>);

  it("renders profile form with user data", () => {
    renderSettings();
    expect(screen.getByDisplayValue("Test")).toBeInTheDocument();
    expect(screen.getByDisplayValue("User")).toBeInTheDocument();
    expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
  });

  it("renders password change form", () => {
    renderSettings();
    expect(screen.getByPlaceholderText("Enter current password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter new password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm new password")).toBeInTheDocument();
  });

  it("renders save and change password buttons", () => {
    renderSettings();
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
    // "Change Password" appears as both heading and button — check button specifically
    const buttons = screen.getAllByRole("button");
    const changeBtn = buttons.find((b) => b.textContent?.includes("Change Password"));
    expect(changeBtn).toBeTruthy();
  });

  it("calls updateProfile on save", async () => {
    mockUpdateProfile.mockResolvedValueOnce({
      first_name: "Updated",
      last_name: "User",
      email: "test@example.com",
    });

    renderSettings();
    await fireEvent.click(screen.getByText("Save Changes"));

    expect(mockUpdateProfile).toHaveBeenCalledWith({
      first_name: "Test",
      last_name: "User",
    });
  });

  it("shows error state on save failure", async () => {
    mockUpdateProfile.mockRejectedValueOnce({ message: "Server error" });

    renderSettings();
    await fireEvent.click(screen.getByText("Save Changes"));

    await new Promise((r) => setTimeout(r, 50));

    expect(screen.getByText("Server error")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });
});

describe("Password Change", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSettings = () => render(() => <MetaProvider><Settings /></MetaProvider>);

  it("calls changePassword on submit", async () => {
    mockChangePassword.mockResolvedValueOnce({ message: "Password changed" });

    renderSettings();

    // The password inputs use PasswordInput which renders type="password" inputs
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    // Current, New, Confirm = 3 password inputs
    if (passwordInputs.length >= 3) {
      await fireEvent.input(passwordInputs[0], { target: { value: "oldpass123" } });
      await fireEvent.input(passwordInputs[1], { target: { value: "newpass123" } });
      await fireEvent.input(passwordInputs[2], { target: { value: "newpass123" } });
    }

    // Find and click Change Password button
    const buttons = screen.getAllByRole("button");
    const changeBtn = buttons.find((b) => b.textContent?.includes("Change Password"));
    if (changeBtn) await fireEvent.click(changeBtn);

    await new Promise((r) => setTimeout(r, 50));
    expect(mockChangePassword).toHaveBeenCalled();
  });

  it("shows error on password mismatch", async () => {
    const { toast } = await import("~/lib/stores");

    renderSettings();

    const passwordInputs = document.querySelectorAll('input[type="password"]');
    if (passwordInputs.length >= 3) {
      await fireEvent.input(passwordInputs[0], { target: { value: "oldpass123" } });
      await fireEvent.input(passwordInputs[1], { target: { value: "newpass123" } });
      await fireEvent.input(passwordInputs[2], { target: { value: "different456" } });
    }

    const buttons = screen.getAllByRole("button");
    const changeBtn = buttons.find((b) => b.textContent?.includes("Change Password"));
    if (changeBtn) await fireEvent.click(changeBtn);

    await new Promise((r) => setTimeout(r, 50));
    expect(toast.error).toHaveBeenCalledWith("Passwords do not match");
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it("shows error on short password", async () => {
    const { toast } = await import("~/lib/stores");

    renderSettings();

    const passwordInputs = document.querySelectorAll('input[type="password"]');
    if (passwordInputs.length >= 3) {
      await fireEvent.input(passwordInputs[0], { target: { value: "oldpass123" } });
      await fireEvent.input(passwordInputs[1], { target: { value: "short" } });
      await fireEvent.input(passwordInputs[2], { target: { value: "short" } });
    }

    const buttons = screen.getAllByRole("button");
    const changeBtn = buttons.find((b) => b.textContent?.includes("Change Password"));
    if (changeBtn) await fireEvent.click(changeBtn);

    await new Promise((r) => setTimeout(r, 50));
    expect(toast.error).toHaveBeenCalledWith("Password must be at least 8 characters");
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it("shows error state on API failure", async () => {
    mockChangePassword.mockRejectedValueOnce({ message: "Current password is incorrect" });

    renderSettings();

    const passwordInputs = document.querySelectorAll('input[type="password"]');
    if (passwordInputs.length >= 3) {
      await fireEvent.input(passwordInputs[0], { target: { value: "wrongpass" } });
      await fireEvent.input(passwordInputs[1], { target: { value: "newpass123" } });
      await fireEvent.input(passwordInputs[2], { target: { value: "newpass123" } });
    }

    const buttons = screen.getAllByRole("button");
    const changeBtn = buttons.find((b) => b.textContent?.includes("Change Password"));
    if (changeBtn) await fireEvent.click(changeBtn);

    await new Promise((r) => setTimeout(r, 100));
    expect(screen.getByText("Current password is incorrect")).toBeInTheDocument();
  });
});
