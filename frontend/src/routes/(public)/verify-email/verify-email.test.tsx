import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { MetaProvider } from "@solidjs/meta";

const mockGet = vi.fn();
let mockSearchParams: Record<string, string> = {};

vi.mock("@solidjs/router", () => ({
  useSearchParams: () => [mockSearchParams],
  A: (props: any) => <a href={props.href}>{props.children}</a>,
}));

vi.mock("~/lib/api", () => ({
  get: (...args: any[]) => mockGet(...args),
}));

import VerifyEmail from "./index";

describe("VerifyEmail Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = {};
  });

  const renderPage = () =>
    render(() => (
      <MetaProvider>
        <VerifyEmail />
      </MetaProvider>
    ));

  it("shows no-token state when token is missing", async () => {
    renderPage();
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText("Check Your Email")).toBeInTheDocument();
  });

  it("shows loading state with token", () => {
    mockSearchParams = { token: "abc123" };
    mockGet.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByText("Verifying your email...")).toBeInTheDocument();
  });

  it("shows success on valid token", async () => {
    mockSearchParams = { token: "valid-token" };
    mockGet.mockResolvedValueOnce({});
    renderPage();
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText("Email Verified!")).toBeInTheDocument();
    expect(screen.getByText("Continue to login")).toBeInTheDocument();
  });

  it("shows error on invalid token", async () => {
    mockSearchParams = { token: "bad-token" };
    mockGet.mockRejectedValueOnce({ message: "Token expired" });
    renderPage();
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText("Verification Failed")).toBeInTheDocument();
    expect(screen.getByText("Token expired")).toBeInTheDocument();
  });

  it("shows generic error when message missing", async () => {
    mockSearchParams = { token: "bad-token" };
    mockGet.mockRejectedValueOnce({});
    renderPage();
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByText("Failed to verify email")).toBeInTheDocument();
  });
});
