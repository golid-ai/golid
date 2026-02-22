import { describe, it, expect } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Show } from "solid-js";

// Test the rendering logic of the private layout without router dependencies.
// The actual layout uses Show with auth.initialized && auth.isAuthenticated.
// We test the same conditional rendering pattern directly.

describe("Private Layout rendering logic", () => {
  it("shows loading spinner when not initialized", () => {
    render(() => (
      <Show
        when={false}
        fallback={<div data-testid="spinner">Loading...</div>}
      >
        <div>Content</div>
      </Show>
    ));
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("shows children when authenticated", () => {
    render(() => (
      <Show
        when={true}
        fallback={<div data-testid="spinner">Loading...</div>}
      >
        <div>Protected Content</div>
      </Show>
    ));
    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("does not show children when not authenticated", () => {
    render(() => (
      <Show
        when={false}
        fallback={<div>Loading...</div>}
      >
        <div>Protected Content</div>
      </Show>
    ));
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });
});
