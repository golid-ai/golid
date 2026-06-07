import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@solidjs/testing-library";
import { LoadingOverlay } from "./LoadingOverlay";
import { ui } from "~/lib/stores/ui";

describe("LoadingOverlay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.style.overflow = "";
  });

  afterEach(() => {
    ui.setLoading(false);
    cleanup();
    vi.useRealTimers();
    document.body.style.overflow = "";
  });

  it("does not render when loading is false", () => {
    render(() => <LoadingOverlay />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders overlay when loading is true", () => {
    ui.setLoading(true);
    render(() => <LoadingOverlay />);
    expect(screen.getByRole("button")).toBeInTheDocument();
    expect(screen.getByText("uƒ")).toBeInTheDocument();
  });

  it("shows custom loading message from ui store", () => {
    ui.setLoading(true, "Saving your work...");
    render(() => <LoadingOverlay />);
    expect(screen.getByText(/Saving your work/)).toBeInTheDocument();
  });

  it("strips trailing dots from custom message", () => {
    ui.setLoading(true, "Please wait...");
    render(() => <LoadingOverlay />);
    expect(screen.getByText(/Please wait/)).toBeInTheDocument();
    expect(screen.queryByText("Please wait...")).not.toBeInTheDocument();
  });

  it("locks body scroll while visible", () => {
    ui.setLoading(true);
    render(() => <LoadingOverlay />);
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("restores body scroll when loading ends", () => {
    ui.setLoading(true);
    const { unmount } = render(() => <LoadingOverlay />);
    expect(document.body.style.overflow).toBe("hidden");

    ui.setLoading(false);
    unmount();
    expect(document.body.style.overflow).toBe("");
  });

  it("animates dots on the cycling message", () => {
    ui.setLoading(true);
    render(() => <LoadingOverlay />);

    const dots = () => document.querySelector(".animated-dots");
    expect(dots()?.textContent).toBe("");

    vi.advanceTimersByTime(600);
    expect(dots()?.textContent).toBe(".");

    vi.advanceTimersByTime(1200);
    expect(dots()?.textContent).toBe("...");
  });

  it("cycles default messages when no custom message is set", () => {
    ui.setLoading(true);
    render(() => <LoadingOverlay />);

    const messageEl = () => document.querySelector(".loading-message");
    const initial = messageEl()?.textContent?.replace(/\.+$/, "") ?? "";

    vi.advanceTimersByTime(2400);
    const next = messageEl()?.textContent?.replace(/\.+$/, "") ?? "";
    expect(next.length).toBeGreaterThan(0);
    expect(next).not.toBe(initial);
  });

  it("does not cycle messages when a custom message is set", () => {
    ui.setLoading(true, "Hold tight");
    render(() => <LoadingOverlay />);

    const messageEl = () => document.querySelector(".loading-message");
    const initial = messageEl()?.textContent?.replace(/\.+$/, "");

    vi.advanceTimersByTime(3000);
    expect(messageEl()?.textContent?.replace(/\.+$/, "")).toBe(initial);
  });

  it("adds jiggle class on click", async () => {
    ui.setLoading(true);
    render(() => <LoadingOverlay />);

    const overlay = document.querySelector(".loading-overlay");
    expect(overlay?.classList.contains("animate-jiggle")).toBe(false);

    await fireEvent.click(screen.getByRole("button"));
    expect(overlay?.classList.contains("animate-jiggle")).toBe(true);

    vi.advanceTimersByTime(500);
    expect(overlay?.classList.contains("animate-jiggle")).toBe(false);
  });

  it("adds jiggle class on Enter key", async () => {
    ui.setLoading(true);
    render(() => <LoadingOverlay />);

    const overlay = document.querySelector(".loading-overlay");
    await fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(overlay?.classList.contains("animate-jiggle")).toBe(true);
  });

  it("renders loading arc images", () => {
    ui.setLoading(true);
    render(() => <LoadingOverlay />);
    const arcs = document.querySelectorAll(".loading-arc");
    expect(arcs.length).toBe(3);
  });
});
