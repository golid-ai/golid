import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { MetaProvider } from "@solidjs/meta";

const mockPost = vi.fn();

vi.mock("~/lib/api", () => ({
  post: (...args: any[]) => mockPost(...args),
}));

vi.mock("@solidjs/router", () => ({
  A: (props: any) => <a href={props.href}>{props.children}</a>,
}));

import ForgotPassword from "./index";

describe("Forgot Password Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () =>
    render(() => (
      <MetaProvider>
        <ForgotPassword />
      </MetaProvider>
    ));

  it("renders email input and submit button", () => {
    renderPage();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByText("Send reset link")).toBeInTheDocument();
  });

  it("renders heading and login link", () => {
    renderPage();
    expect(screen.getByText("Forgot your password?")).toBeInTheDocument();
    expect(screen.getByText("Log in")).toBeInTheDocument();
  });

  it("shows confirmation after successful submit", async () => {
    mockPost.mockResolvedValueOnce({});

    renderPage();

    await fireEvent.input(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@example.com" },
    });
    await fireEvent.click(screen.getByText("Send reset link"));

    await new Promise((r) => setTimeout(r, 50));

    expect(screen.getByText("Check your email")).toBeInTheDocument();
    expect(screen.getByText("Back to login")).toBeInTheDocument();
    expect(mockPost).toHaveBeenCalledWith(
      "/auth/forgot-password",
      { email: "test@example.com" },
      { skipAuth: true },
    );
  });

  it("shows error on API failure", async () => {
    mockPost.mockRejectedValueOnce({ message: "Something went wrong. Please try again." });

    renderPage();

    await fireEvent.input(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@example.com" },
    });
    await fireEvent.click(screen.getByText("Send reset link"));

    await new Promise((r) => setTimeout(r, 50));

    expect(screen.getByText("Something went wrong. Please try again.")).toBeInTheDocument();
    expect(screen.queryByText("Check your email")).not.toBeInTheDocument();
  });

  it("shows generic error when message is missing", async () => {
    mockPost.mockRejectedValueOnce({});

    renderPage();

    await fireEvent.input(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "test@example.com" },
    });
    await fireEvent.click(screen.getByText("Send reset link"));

    await new Promise((r) => setTimeout(r, 50));

    expect(
      screen.getByText("Something went wrong. Please try again."),
    ).toBeInTheDocument();
  });
});
