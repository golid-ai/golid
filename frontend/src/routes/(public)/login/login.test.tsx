import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { MetaProvider } from "@solidjs/meta";

const mockLogin = vi.fn();
const mockNavigate = vi.fn();

vi.mock("~/lib/auth", () => ({
  auth: {
    login: (...args: any[]) => mockLogin(...args),
  },
}));

vi.mock("@solidjs/router", () => ({
  useNavigate: () => mockNavigate,
  useSearchParams: () => [{}],
  A: (props: any) => <a href={props.href}>{props.children}</a>,
}));

import Login from "./index";

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderLogin = () =>
    render(() => (
      <MetaProvider>
        <Login />
      </MetaProvider>
    ));

  it("renders email and password inputs", () => {
    renderLogin();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  it("renders sign in button", () => {
    renderLogin();
    expect(screen.getByText("Sign in")).toBeInTheDocument();
  });

  it("renders forgot password and signup links", () => {
    renderLogin();
    expect(screen.getByText("Forgot password?")).toBeInTheDocument();
    expect(screen.getByText("Create one")).toBeInTheDocument();
  });

  it("navigates to dashboard on successful login", async () => {
    mockLogin.mockResolvedValueOnce({});

    renderLogin();

    await fireEvent.input(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" },
    });
    await fireEvent.input(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });
    await fireEvent.click(screen.getByText("Sign in"));

    await new Promise((r) => setTimeout(r, 50));

    expect(mockLogin).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
  });

  it("shows error on failed login", async () => {
    mockLogin.mockRejectedValueOnce({ message: "Invalid email or password" });

    renderLogin();

    await fireEvent.input(screen.getByPlaceholderText("Email"), {
      target: { value: "wrong@example.com" },
    });
    await fireEvent.input(screen.getByPlaceholderText("Password"), {
      target: { value: "wrongpass" },
    });
    await fireEvent.click(screen.getByText("Sign in"));

    await new Promise((r) => setTimeout(r, 50));

    expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
  });

  it("shows generic error when message is missing", async () => {
    mockLogin.mockRejectedValueOnce({});

    renderLogin();

    await fireEvent.input(screen.getByPlaceholderText("Email"), {
      target: { value: "test@example.com" },
    });
    await fireEvent.input(screen.getByPlaceholderText("Password"), {
      target: { value: "password123" },
    });
    await fireEvent.click(screen.getByText("Sign in"));

    await new Promise((r) => setTimeout(r, 50));

    expect(
      screen.getByText("Invalid email or password"),
    ).toBeInTheDocument();
  });
});
