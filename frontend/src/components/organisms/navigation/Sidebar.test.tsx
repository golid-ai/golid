import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { cleanup, render, screen, fireEvent } from "@solidjs/testing-library";
import axe from "axe-core";

const { mockPathname, mockAuth, mockSubscribeMobile } = vi.hoisted(() => ({
  mockPathname: vi.fn(() => "/dashboard"),
  mockAuth: {
    user: { first_name: "Jane", last_name: "Doe" } as {
      first_name?: string;
      last_name?: string;
    } | null,
    isAdmin: true,
    isAuthenticated: true,
    logout: vi.fn(),
  },
  mockSubscribeMobile: vi.fn(() => false),
}));

vi.mock("@solidjs/router", () => ({
  A: (props: any) => (
    <a href={props.href} class={props.class} title={props.title}>
      {props.children}
    </a>
  ),
  useLocation: () => ({ pathname: mockPathname() }),
}));

vi.mock("~/lib/auth", () => ({
  auth: mockAuth,
}));

vi.mock("~/lib/stores/ui", () => ({
  ui: {
    subscribeMobile: () => mockSubscribeMobile(),
  },
}));

import { Sidebar } from "./Sidebar";

afterEach(cleanup);

describe("Sidebar", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/dashboard");
    mockAuth.user = { first_name: "Jane", last_name: "Doe" };
    mockAuth.isAdmin = true;
    mockSubscribeMobile.mockReturnValue(false);
    vi.clearAllMocks();
  });

  it("renders nav items", () => {
    render(() => <Sidebar />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Components")).toBeInTheDocument();
  });

  it("renders user display name", () => {
    render(() => <Sidebar />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("shows admin-only items for admins", () => {
    render(() => <Sidebar />);
    expect(screen.getByText("Components")).toBeInTheDocument();
  });

  it("hides admin-only items when not admin", () => {
    mockAuth.isAdmin = false;
    render(() => <Sidebar />);
    expect(screen.queryByText("Components")).toBeNull();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("renders collapse toggle", () => {
    render(() => <Sidebar />);
    expect(screen.getByLabelText(/collapse|expand/i)).toBeInTheDocument();
  });

  it("shows expand label when collapsed", () => {
    render(() => <Sidebar collapsed onToggle={() => {}} />);
    expect(screen.getByLabelText("Expand Sidebar")).toBeInTheDocument();
  });

  it("falls back to Account when user is null", () => {
    mockAuth.user = null;
    render(() => <Sidebar />);
    expect(screen.getByText("Account")).toBeInTheDocument();
  });

  it("falls back to Account when user has no first name", () => {
    mockAuth.user = { last_name: "Doe" };
    render(() => <Sidebar />);
    expect(screen.getByText("Account")).toBeInTheDocument();
  });

  it("marks dashboard active for nested pathname", () => {
    mockPathname.mockReturnValue("/dashboard/reports");
    const { container } = render(() => <Sidebar />);
    const dashboardLink = screen.getByText("Dashboard").closest("a");
    expect(dashboardLink).toHaveClass("font-medium");
    expect(container.querySelector('a[href="/dashboard"] span.text-active-green')).toBeTruthy();
  });

  it("marks settings active for nested pathname", () => {
    mockPathname.mockReturnValue("/settings/profile");
    const { container } = render(() => <Sidebar />);
    const settingsLink = container.querySelector('a[href="/settings"]');
    expect(settingsLink).toHaveClass("font-medium");
    expect(settingsLink?.querySelector("span.text-active-green")).toBeTruthy();
  });

  describe("mobile overlay", () => {
    beforeEach(() => {
      mockSubscribeMobile.mockReturnValue(true);
    });

    it("renders overlay with close buttons when mobile", () => {
      render(() => <Sidebar collapsed={false} onToggle={() => {}} />);
      const closeButtons = screen.getAllByLabelText("Close menu");
      expect(closeButtons).toHaveLength(2);
    });

    it("hides overlay visually when collapsed", () => {
      const { container } = render(() => <Sidebar collapsed onToggle={() => {}} />);
      const overlay = container.querySelector(".fixed.inset-0.top-16");
      expect(overlay).toHaveClass("opacity-0", "pointer-events-none");
    });

    it("shows overlay when not collapsed", () => {
      const { container } = render(() => <Sidebar collapsed={false} onToggle={() => {}} />);
      const overlay = container.querySelector(".fixed.inset-0.top-16");
      expect(overlay).toHaveClass("opacity-100");
    });

    it("calls onToggle when backdrop close clicked", async () => {
      const onToggle = vi.fn();
      render(() => <Sidebar collapsed={false} onToggle={onToggle} />);
      const closeButtons = screen.getAllByLabelText("Close menu");
      await fireEvent.click(closeButtons[0]);
      expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it("calls onToggle when header close clicked", async () => {
      const onToggle = vi.fn();
      render(() => <Sidebar collapsed={false} onToggle={onToggle} />);
      const closeButtons = screen.getAllByLabelText("Close menu");
      await fireEvent.click(closeButtons[1]);
      expect(onToggle).toHaveBeenCalledTimes(1);
    });
  });

  it("has no a11y violations", async () => {
    const { container } = render(() => <Sidebar collapsed={false} onToggle={() => {}} />);
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
