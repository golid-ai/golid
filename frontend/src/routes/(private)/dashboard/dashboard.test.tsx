import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { MetaProvider } from "@solidjs/meta";

vi.mock("@solidjs/router", () => ({
  A: (props: any) => <a href={props.href}>{props.children}</a>,
}));

vi.mock("~/lib/auth", () => ({
  auth: {
    user: {
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
      type: "admin",
      email_verified: true,
      created_at: "2026-01-15T00:00:00Z",
    },
    isAdmin: true,
  },
}));

import Dashboard from "./index";

describe("Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderPage = () =>
    render(() => (
      <MetaProvider>
        <Dashboard />
      </MetaProvider>
    ));

  it("renders dashboard heading", () => {
    renderPage();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("shows welcome message with user name", () => {
    renderPage();
    expect(screen.getByText(/Welcome.*Jane/)).toBeInTheDocument();
  });

  it("shows user email", () => {
    renderPage();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  it("shows quick links", () => {
    renderPage();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Components")).toBeInTheDocument();
  });

  it("shows account info", () => {
    renderPage();
    expect(screen.getByText("admin")).toBeInTheDocument();
    expect(screen.getByText("Yes")).toBeInTheDocument();
  });

  it("shows scaffold placeholder", () => {
    renderPage();
    expect(screen.getByText("Your Feature")).toBeInTheDocument();
  });
});
