import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@solidjs/testing-library";
import {
  useBreakpoint,
  useCurrentBreakpoint,
  useIsMobile,
  breakpoints,
} from "./use-breakpoint";

afterEach(cleanup);

function BreakpointProbe(props: { bp?: "sm" | "md" | "lg" }) {
  const isBelow = useBreakpoint(props.bp);
  return <span data-testid="below">{isBelow() ? "yes" : "no"}</span>;
}

function CurrentBreakpointProbe() {
  const current = useCurrentBreakpoint();
  return <span data-testid="current">{current()}</span>;
}

function MobileProbe() {
  const isMobile = useIsMobile();
  return <span data-testid="mobile">{isMobile() ? "yes" : "no"}</span>;
}

describe("useBreakpoint", () => {
  beforeEach(() => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(500);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true when viewport is below the breakpoint", () => {
    const { getByTestId } = render(() => <BreakpointProbe bp="lg" />);
    expect(getByTestId("below").textContent).toBe("yes");
  });

  it("returns false when viewport is above the breakpoint", () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(1200);
    const { getByTestId } = render(() => <BreakpointProbe bp="lg" />);
    expect(getByTestId("below").textContent).toBe("no");
  });

  it("updates when window resizes", () => {
    const { getByTestId } = render(() => <BreakpointProbe bp="md" />);
    expect(getByTestId("below").textContent).toBe("yes");

    vi.spyOn(window, "innerWidth", "get").mockReturnValue(900);
    window.dispatchEvent(new Event("resize"));
    expect(getByTestId("below").textContent).toBe("no");
  });

  it("defaults to lg breakpoint", () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(breakpoints.lg - 1);
    const { getByTestId } = render(() => <BreakpointProbe />);
    expect(getByTestId("below").textContent).toBe("yes");
  });
});

describe("useCurrentBreakpoint", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [500, "xs"],
    [700, "sm"],
    [900, "md"],
    [1100, "lg"],
    [1300, "xl"],
    [1600, "2xl"],
  ] as const)("maps width %i to %s", (width, expected) => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(width);
    const { getByTestId } = render(() => <CurrentBreakpointProbe />);
    expect(getByTestId("current").textContent).toBe(expected);
  });
});

describe("useIsMobile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns true below lg breakpoint", () => {
    vi.spyOn(window, "innerWidth", "get").mockReturnValue(breakpoints.lg - 1);
    const { getByTestId } = render(() => <MobileProbe />);
    expect(getByTestId("mobile").textContent).toBe("yes");
  });
});
