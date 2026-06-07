import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { MetaProvider } from "@solidjs/meta";

// Mock dependencies before importing the component
const mockUpdateProfile = vi.fn();
const mockChangePassword = vi.fn();
const mockUpdateUser = vi.fn();

let mockAuthUser: {
  first_name: string;
  last_name: string;
  email: string;
  type: string;
  email_verified: boolean;
} | null = {
  first_name: "Test",
  last_name: "User",
  email: "test@example.com",
  type: "user",
  email_verified: true,
};

vi.mock("~/lib/api", () => ({
  usersApi: { updateProfile: (...args: any[]) => mockUpdateProfile(...args) },
  authApi: { changePassword: (...args: any[]) => mockChangePassword(...args) },
  getErrorMessage: (err: any) => err?.message || "Something went wrong",
}));

vi.mock("~/lib/auth", () => ({
  auth: {
    get user() {
      return mockAuthUser;
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
    mockAuthUser = {
      first_name: "Test",
      last_name: "User",
      email: "test@example.com",
      type: "user",
      email_verified: true,
    };
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

  it("shows success toast and updates auth user on save", async () => {
    const { toast } = await import("~/lib/stores");
    mockUpdateProfile.mockResolvedValueOnce({
      first_name: "Updated",
      last_name: "Name",
      email: "test@example.com",
    });

    renderSettings();
    await fireEvent.click(screen.getByText("Save Changes"));

    await new Promise((r) => setTimeout(r, 50));
    expect(toast.success).toHaveBeenCalledWith("Profile updated");
    expect(mockUpdateUser).toHaveBeenCalledWith({
      first_name: "Updated",
      last_name: "Name",
      email: "test@example.com",
    });
  });

  it("prefills empty names when user fields are missing", async () => {
    mockAuthUser = {
      first_name: "",
      last_name: "",
      email: "test@example.com",
      type: "user",
      email_verified: true,
    };

    renderSettings();
    await new Promise((r) => setTimeout(r, 50));

    expect(screen.getByLabelText("First Name")).toHaveValue("");
    expect(screen.getByLabelText("Last Name")).toHaveValue("");
  });

  it("shows error state on save failure", async () => {
    mockUpdateProfile.mockRejectedValueOnce({ message: "Server error" });

    renderSettings();
    await fireEvent.click(screen.getByText("Save Changes"));

    await new Promise((r) => setTimeout(r, 50));

    expect(screen.getByText("Server error")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("retries profile save from error state", async () => {
    mockUpdateProfile
      .mockRejectedValueOnce({ message: "Server error" })
      .mockResolvedValueOnce({
        first_name: "Test",
        last_name: "User",
        email: "test@example.com",
      });

    renderSettings();
    await fireEvent.click(screen.getByText("Save Changes"));
    await new Promise((r) => setTimeout(r, 50));
    await fireEvent.click(screen.getByText("Retry"));
    await new Promise((r) => setTimeout(r, 50));

    expect(mockUpdateProfile).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("Server error")).not.toBeInTheDocument();
  });

  it("leaves profile fields empty when auth user is absent", async () => {
    mockAuthUser = null;

    renderSettings();
    await new Promise((r) => setTimeout(r, 50));

    expect(screen.getByLabelText("First Name")).toHaveValue("");
    expect(screen.getByLabelText("Last Name")).toHaveValue("");
    expect(screen.getByLabelText("Email")).toHaveValue("");
  });
});

describe("Password Change", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser = {
      first_name: "Test",
      last_name: "User",
      email: "test@example.com",
      type: "user",
      email_verified: true,
    };
  });

  const renderSettings = () => render(() => <MetaProvider><Settings /></MetaProvider>);

  const getPasswordInputs = () => {
    const inputs = document.querySelectorAll('input[type="password"]');
    expect(inputs.length).toBeGreaterThanOrEqual(3);
    return inputs;
  };

  const clickChangePassword = async () => {
    const buttons = screen.getAllByRole("button");
    const changeBtn = buttons.find((b) => b.textContent?.includes("Change Password"));
    expect(changeBtn).toBeTruthy();
    await fireEvent.click(changeBtn!);
  };

  const fillPasswordForm = async (
    current: string,
    newPass: string,
    confirm: string,
  ) => {
    const passwordInputs = getPasswordInputs();
    await fireEvent.input(passwordInputs[0], { target: { value: current } });
    await fireEvent.input(passwordInputs[1], { target: { value: newPass } });
    await fireEvent.input(passwordInputs[2], { target: { value: confirm } });
  };

  it("calls changePassword on submit", async () => {
    mockChangePassword.mockResolvedValueOnce({ message: "Password changed" });

    renderSettings();
    await fillPasswordForm("oldpass123", "newpass123", "newpass123");
    await clickChangePassword();

    await new Promise((r) => setTimeout(r, 50));
    expect(mockChangePassword).toHaveBeenCalled();
  });

  it("shows error on password mismatch", async () => {
    const { toast } = await import("~/lib/stores");

    renderSettings();
    await fillPasswordForm("oldpass123", "newpass123", "different456");
    await clickChangePassword();

    await new Promise((r) => setTimeout(r, 50));
    expect(toast.error).toHaveBeenCalledWith("Passwords do not match");
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it("shows error on short password", async () => {
    const { toast } = await import("~/lib/stores");

    renderSettings();
    await fillPasswordForm("oldpass123", "short", "short");
    await clickChangePassword();

    await new Promise((r) => setTimeout(r, 50));
    expect(toast.error).toHaveBeenCalledWith("Password must be at least 8 characters");
    expect(mockChangePassword).not.toHaveBeenCalled();
  });

  it("shows error state on API failure", async () => {
    mockChangePassword.mockRejectedValueOnce({ message: "Current password is incorrect" });

    renderSettings();
    await fillPasswordForm("wrongpass", "newpass123", "newpass123");
    await clickChangePassword();

    await new Promise((r) => setTimeout(r, 100));
    expect(screen.getByText("Current password is incorrect")).toBeInTheDocument();
  });

  it("shows success toast on password change", async () => {
    const { toast } = await import("~/lib/stores");
    mockChangePassword.mockResolvedValueOnce({ message: "Password changed" });

    renderSettings();
    await fillPasswordForm("oldpass123", "newpass123", "newpass123");
    await clickChangePassword();

    await new Promise((r) => setTimeout(r, 100));
    expect(toast.success).toHaveBeenCalledWith("Password changed successfully");
  });
});
