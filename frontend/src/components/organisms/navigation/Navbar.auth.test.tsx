import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";

const mockNavigate = vi.fn();
const mockLogout = vi.fn().mockResolvedValue(undefined);

vi.mock("@solidjs/router", () => ({
  A: (props: any) => <a href={props.href} aria-label={props["aria-label"]}>{props.children}</a>,
  useNavigate: () => mockNavigate,
}));

vi.mock("~/lib/auth", () => ({
  auth: {
    initialized: true,
    isAuthenticated: true,
    user: { first_name: "Jane", type: "admin" },
    isAdmin: true,
    logout: () => mockLogout(),
  },
}));

vi.mock("~/lib/stores/ui", () => ({
  ui: {
    toggleTheme: vi.fn(),
  },
}));

import { Navbar } from "./Navbar";

describe("Navbar (authenticated)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows Dashboard button when authenticated", () => {
    render(() => <Navbar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("shows Logout button when authenticated", () => {
    render(() => <Navbar />);
    expect(screen.getByText("Logout")).toBeInTheDocument();
  });

  it("does not show Login/Sign Up when authenticated", () => {
    render(() => <Navbar />);
    expect(screen.queryByText("Login")).toBeNull();
    expect(screen.queryByText("Sign Up")).toBeNull();
  });

  it("renders sidebar toggle when showMenuButton is true", () => {
    render(() => <Navbar showMenuButton />);
    expect(screen.getByLabelText("Toggle Sidebar")).toBeInTheDocument();
  });

  it("calls onMenuToggle when sidebar toggle clicked", async () => {
    const onToggle = vi.fn();
    render(() => <Navbar showMenuButton onMenuToggle={onToggle} />);
    await fireEvent.click(screen.getByLabelText("Toggle Sidebar"));
    expect(onToggle).toHaveBeenCalled();
  });

  it("renders mobile menu button when showMenuButton is false", () => {
    render(() => <Navbar />);
    expect(screen.getByLabelText("Menu")).toBeInTheDocument();
  });

  it("opens mobile menu with Dashboard link", async () => {
    render(() => <Navbar />);
    await fireEvent.click(screen.getByLabelText("Menu"));
    const dashButtons = screen.getAllByText("Dashboard");
    expect(dashButtons.length).toBeGreaterThanOrEqual(2);
  });
});
