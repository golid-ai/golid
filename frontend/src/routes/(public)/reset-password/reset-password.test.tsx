import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { MetaProvider } from "@solidjs/meta";

const mockNavigate = vi.fn();
const mockGet = vi.fn();
const mockPost = vi.fn();
let mockSearchParams: Record<string, string> = {};

vi.mock("@solidjs/router", () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [mockSearchParams],
  A: (props: any) => <a href={props.href}>{props.children}</a>,
}));

vi.mock("~/lib/api", () => ({
  get: (...args: any[]) => mockGet(...args),
  post: (...args: any[]) => mockPost(...args),
}));

import ResetPassword from "./index";

describe("ResetPassword Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = {};
  });

  const renderPage = () =>
    render(() => (
      <MetaProvider>
        <ResetPassword />
      </MetaProvider>
    ));

  it("shows no-token state when token is missing", async () => {
    mockSearchParams = {};
    renderPage();
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText("Invalid Reset Link")).toBeInTheDocument();
  });

  it("shows validating state initially with token", () => {
    mockSearchParams = { token: "abc123" };
    mockGet.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText("Validating reset link...")).toBeInTheDocument();
  });

  it("shows form when token is valid", async () => {
    mockSearchParams = { token: "valid-token" };
    mockGet.mockResolvedValueOnce({ valid: true, email: "user@test.com" });
    renderPage();
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText("Reset your password")).toBeInTheDocument();
    expect(screen.getByText("user@test.com")).toBeInTheDocument();
  });

  it("shows expired state when token is invalid", async () => {
    mockSearchParams = { token: "expired-token" };
    mockGet.mockResolvedValueOnce({ valid: false });
    renderPage();
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText("Link Expired")).toBeInTheDocument();
  });

  it("validates password mismatch", async () => {
    mockSearchParams = { token: "valid-token" };
    mockGet.mockResolvedValueOnce({ valid: true });
    renderPage();
    await new Promise((r) => setTimeout(r, 50));

    await fireEvent.input(screen.getByLabelText("New password"), {
      target: { value: "password123" },
    });
    await fireEvent.input(screen.getByLabelText("Confirm new password"), {
      target: { value: "different456" },
    });
    await fireEvent.click(screen.getByText("Reset password"));
    await new Promise((r) => setTimeout(r, 50));

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
  });

  it("validates password length", async () => {
    mockSearchParams = { token: "valid-token" };
    mockGet.mockResolvedValueOnce({ valid: true });
    renderPage();
    await new Promise((r) => setTimeout(r, 50));

    await fireEvent.input(screen.getByLabelText("New password"), {
      target: { value: "short" },
    });
    await fireEvent.input(screen.getByLabelText("Confirm new password"), {
      target: { value: "short" },
    });
    await fireEvent.click(screen.getByText("Reset password"));
    await new Promise((r) => setTimeout(r, 50));

    expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
  });

  it("shows success after reset", async () => {
    mockSearchParams = { token: "valid-token" };
    mockGet.mockResolvedValueOnce({ valid: true });
    mockPost.mockResolvedValueOnce({});
    renderPage();
    await new Promise((r) => setTimeout(r, 50));

    await fireEvent.input(screen.getByLabelText("New password"), {
      target: { value: "newpassword123" },
    });
    await fireEvent.input(screen.getByLabelText("Confirm new password"), {
      target: { value: "newpassword123" },
    });
    await fireEvent.click(screen.getByText("Reset password"));
    await new Promise((r) => setTimeout(r, 50));

    expect(screen.getByText("Password Reset!")).toBeInTheDocument();
  });
});
