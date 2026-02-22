import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import axe from "axe-core";

vi.mock("@solidjs/router", () => ({
  A: (props: any) => <a href={props.href} class={props.class} title={props.title}>{props.children}</a>,
  useLocation: () => ({ pathname: "/dashboard" }),
}));

vi.mock("~/lib/auth", () => ({
  auth: {
    user: { first_name: "Jane", last_name: "Doe" },
    isAdmin: true,
    isAuthenticated: true,
    logout: vi.fn(),
  },
}));

vi.mock("~/lib/stores/ui", () => ({
  ui: {
    subscribeMobile: () => false,
  },
}));

import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
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

  it("renders collapse toggle", () => {
    render(() => <Sidebar />);
    expect(screen.getByLabelText(/collapse|expand/i)).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    const { container } = render(() => <Sidebar collapsed={false} onToggle={() => {}} />);
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
