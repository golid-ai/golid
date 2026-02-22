import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { toast } from "~/lib/stores/toast";
import { Toaster } from "./Toaster";

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("crypto", { randomUUID: () => "toast-" + Math.random().toString(36).slice(2, 8) });
});

afterEach(() => {
  while (toast.toasts.length > 0) {
    toast.remove(toast.toasts[0].id);
  }
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Toaster", () => {
  it("renders empty container when no toasts", () => {
    const { container } = render(() => <Toaster />);
    expect(container.querySelector("#flashMessages")).toBeInTheDocument();
  });

  it("renders toast messages", () => {
    toast.success("Saved!");
    render(() => <Toaster />);
    expect(screen.getByText("Saved!")).toBeInTheDocument();
  });

  it("renders multiple toasts", () => {
    toast.success("First");
    toast.error("Second");
    render(() => <Toaster />);
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });
});
