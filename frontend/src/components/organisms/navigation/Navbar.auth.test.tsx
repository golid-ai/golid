import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@solidjs/testing-library";

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

afterEach(cleanup);

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

  describe("mobile drawer (authenticated)", () => {
    it("opens drawer with Dashboard and Logout menu items", async () => {
      render(() => <Navbar />);
      await fireEvent.click(screen.getByLabelText("Menu"));

      const menu = screen.getByRole("menu");
      expect(menu).toBeInTheDocument();
      expect(screen.getAllByRole("menuitem")).toHaveLength(2);
      expect(screen.getByRole("menuitem", { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole("menuitem", { name: /logout/i })).toBeInTheDocument();
    });

    it("navigates to dashboard and closes drawer on Dashboard click", async () => {
      render(() => <Navbar />);
      await fireEvent.click(screen.getByLabelText("Menu"));
      await fireEvent.click(screen.getByRole("menuitem", { name: /dashboard/i }));

      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
      await waitFor(() => {
        expect(screen.queryByRole("menu")).toBeNull();
      });
    });

    it("logs out and navigates when Logout menu item clicked", async () => {
      render(() => <Navbar />);
      await fireEvent.click(screen.getByLabelText("Menu"));
      await fireEvent.click(screen.getByRole("menuitem", { name: /logout/i }));

      expect(mockLogout).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/");
      });
    });

    it("closes drawer when backdrop clicked", async () => {
      render(() => <Navbar />);
      await fireEvent.click(screen.getByLabelText("Menu"));
      expect(screen.getByRole("menu")).toBeInTheDocument();

      await fireEvent.click(screen.getByLabelText("Close menu"));
      await waitFor(() => {
        expect(screen.queryByRole("menu")).toBeNull();
      });
    });

    it("closes drawer on Escape key", async () => {
      render(() => <Navbar />);
      await fireEvent.click(screen.getByLabelText("Menu"));
      const menu = screen.getByRole("menu");

      fireEvent.keyDown(menu, { key: "Escape" });
      await waitFor(() => {
        expect(screen.queryByRole("menu")).toBeNull();
      });
    });
  });
});
