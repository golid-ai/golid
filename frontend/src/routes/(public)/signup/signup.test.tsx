import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { MetaProvider } from "@solidjs/meta";

const mockSignup = vi.fn();
const mockNavigate = vi.fn();

vi.mock("~/lib/auth", () => ({
  auth: {
    signup: (...args: any[]) => mockSignup(...args),
  },
}));

vi.mock("@solidjs/router", () => ({
  useNavigate: () => mockNavigate,
  A: (props: any) => <a href={props.href}>{props.children}</a>,
}));

import Signup from "./index";

describe("Signup Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderSignup = () =>
    render(() => (
      <MetaProvider>
        <Signup />
      </MetaProvider>
    ));

  it("renders all form fields", () => {
    renderSignup();
    expect(screen.getByPlaceholderText("John")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Doe")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Create a password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm your password")).toBeInTheDocument();
  });

  it("renders create account button", () => {
    renderSignup();
    expect(screen.getByText("Create Account")).toBeInTheDocument();
  });

  it("renders sign in link", () => {
    renderSignup();
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("navigates to dashboard on successful signup", async () => {
    mockSignup.mockResolvedValueOnce({});

    renderSignup();

    await fireEvent.input(screen.getByPlaceholderText("John"), {
      target: { value: "Jane" },
    });
    await fireEvent.input(screen.getByPlaceholderText("Doe"), {
      target: { value: "Smith" },
    });
    await fireEvent.input(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "jane@example.com" },
    });
    await fireEvent.input(screen.getByPlaceholderText("Create a password"), {
      target: { value: "password123" },
    });
    await fireEvent.input(screen.getByPlaceholderText("Confirm your password"), {
      target: { value: "password123" },
    });

    await fireEvent.click(screen.getByText("Create Account"));

    await new Promise((r) => setTimeout(r, 50));

    expect(mockSignup).toHaveBeenCalledWith({
      email: "jane@example.com",
      password: "password123",
      first_name: "Jane",
      last_name: "Smith",
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("shows error on failed signup", async () => {
    mockSignup.mockRejectedValueOnce({ message: "Email already registered" });

    renderSignup();

    await fireEvent.input(screen.getByPlaceholderText("John"), {
      target: { value: "Jane" },
    });
    await fireEvent.input(screen.getByPlaceholderText("Doe"), {
      target: { value: "Smith" },
    });
    await fireEvent.input(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "jane@example.com" },
    });
    await fireEvent.input(screen.getByPlaceholderText("Create a password"), {
      target: { value: "password123" },
    });
    await fireEvent.input(screen.getByPlaceholderText("Confirm your password"), {
      target: { value: "password123" },
    });

    await fireEvent.click(screen.getByText("Create Account"));

    await new Promise((r) => setTimeout(r, 50));

    expect(screen.getByText("Email already registered")).toBeInTheDocument();
  });

  it("shows generic error when message is missing", async () => {
    mockSignup.mockRejectedValueOnce({});

    renderSignup();

    await fireEvent.input(screen.getByPlaceholderText("John"), {
      target: { value: "Jane" },
    });
    await fireEvent.input(screen.getByPlaceholderText("Doe"), {
      target: { value: "Smith" },
    });
    await fireEvent.input(screen.getByPlaceholderText("you@example.com"), {
      target: { value: "jane@example.com" },
    });
    await fireEvent.input(screen.getByPlaceholderText("Create a password"), {
      target: { value: "password123" },
    });
    await fireEvent.input(screen.getByPlaceholderText("Confirm your password"), {
      target: { value: "password123" },
    });

    await fireEvent.click(screen.getByText("Create Account"));

    await new Promise((r) => setTimeout(r, 50));

    expect(screen.getByText("Registration failed")).toBeInTheDocument();
  });
});
