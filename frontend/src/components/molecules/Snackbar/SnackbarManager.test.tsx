import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { snackbar } from "~/lib/stores/snackbar";
import { SnackbarManager } from "./SnackbarManager";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("crypto", { randomUUID: () => "snack-" + Math.random().toString(36).slice(2, 8) });
});

afterEach(() => {
  while (snackbar.snackbars.length > 0) {
    snackbar.remove(snackbar.snackbars[0].id);
  }
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("SnackbarManager", () => {
  it("renders empty container when no snackbars", () => {
    const { container } = render(() => <SnackbarManager />);
    expect(container.querySelector("#snackbarContainer")).toBeInTheDocument();
  });

  it("renders snackbar messages", () => {
    snackbar.show("Item deleted");
    render(() => <SnackbarManager />);
    expect(screen.getByText("Item deleted")).toBeInTheDocument();
  });

  it("renders multiple snackbars", () => {
    snackbar.show("First action");
    snackbar.show("Second action");
    render(() => <SnackbarManager />);
    expect(screen.getByText("First action")).toBeInTheDocument();
    expect(screen.getByText("Second action")).toBeInTheDocument();
  });
});
