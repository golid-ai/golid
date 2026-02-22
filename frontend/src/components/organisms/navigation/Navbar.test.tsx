import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import axe from "axe-core";

vi.mock("@solidjs/router", () => ({
  A: (props: any) => <a href={props.href} aria-label={props["aria-label"]}>{props.children}</a>,
  useNavigate: () => vi.fn(),
}));

vi.mock("~/lib/auth", () => ({
  auth: {
    initialized: true,
    isAuthenticated: false,
    user: null,
    isAdmin: false,
    logout: vi.fn(),
  },
}));

vi.mock("~/lib/stores/ui", () => ({
  ui: {
    toggleTheme: vi.fn(),
  },
}));

import { Navbar } from "./Navbar";

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the Golid logo", () => {
    render(() => <Navbar />);
    expect(screen.getByText("Golid")).toBeInTheDocument();
  });

  it("renders home link", () => {
    render(() => <Navbar />);
    expect(screen.getByLabelText("Home")).toBeInTheDocument();
  });

  it("renders Login and Sign Up buttons when not authenticated", () => {
    render(() => <Navbar />);
    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Sign Up")).toBeInTheDocument();
  });

  it("renders theme toggle after mount", () => {
    render(() => <Navbar />);
    expect(screen.getByLabelText("Toggle theme")).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    const { container } = render(() => <Navbar />);
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
