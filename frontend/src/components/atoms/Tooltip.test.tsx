import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Tooltip, type TooltipPosition } from "./Tooltip";

function mockViewport(width: number, height: number) {
  Object.defineProperty(document.documentElement, "clientWidth", {
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, "innerHeight", {
    configurable: true,
    value: height,
  });
}

function mockRects(
  trigger: Partial<DOMRect>,
  tooltip: Partial<DOMRect>
) {
  const triggerRect = {
    top: 200,
    bottom: 240,
    left: 400,
    right: 480,
    width: 80,
    height: 40,
    x: 400,
    y: 200,
    toJSON: () => ({}),
    ...trigger,
  } as DOMRect;

  const tooltipRect = {
    top: 0,
    bottom: 40,
    left: 0,
    right: 120,
    width: 120,
    height: 40,
    x: 0,
    y: 0,
    toJSON: () => ({}),
    ...tooltip,
  } as DOMRect;

  HTMLElement.prototype.getBoundingClientRect = function (this: HTMLElement) {
    if (this.getAttribute("role") === "tooltip") {
      return tooltipRect;
    }
    return triggerRect;
  };
}

describe("Tooltip", () => {
  beforeEach(() => {
    mockViewport(1024, 768);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
  test("renders children", () => {
    render(() => <Tooltip message="Helpful hint"><button>Hover me</button></Tooltip>);
    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  test("has tooltip role", () => {
    render(() => <Tooltip message="Info"><span>Target</span></Tooltip>);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  test("renders tooltip message text", () => {
    render(() => <Tooltip message="Click to save"><button>Save</button></Tooltip>);
    expect(screen.getByText("Click to save")).toBeInTheDocument();
  });

  test("sets aria-describedby on container", () => {
    const { container } = render(() => <Tooltip message="Hint"><span>Target</span></Tooltip>);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute("aria-describedby")).toBeTruthy();
  });

  test("tooltip id matches aria-describedby", () => {
    const { container } = render(() => <Tooltip message="Hint"><span>X</span></Tooltip>);
    const wrapper = container.firstElementChild as HTMLElement;
    const describedBy = wrapper.getAttribute("aria-describedby")!;
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.id).toBe(describedBy);
  });

  test.each<TooltipPosition>(["top", "bottom", "left", "right"])(
    "renders with %s position preference",
    (position) => {
      const { container } = render(() => (
        <Tooltip message="Positioned" position={position}>
          <button type="button">Target</button>
        </Tooltip>
      ));
      const tooltip = screen.getByRole("tooltip");
      expect(tooltip).toBeInTheDocument();
      expect(container.querySelector(".group")).toBeTruthy();
    }
  );

  test("recalculates position on mouse enter", async () => {
    mockRects(
      { top: 10, bottom: 50, left: 400, right: 480 },
      { width: 120, height: 40 }
    );

    const { container } = render(() => (
      <Tooltip message="Flip down" position="top">
        <button type="button">Target</button>
      </Tooltip>
    ));

    const wrapper = container.firstElementChild as HTMLElement;
    await fireEvent.mouseEnter(wrapper);

    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("top-full");
  });

  test("flips from top to bottom when space above is tight", async () => {
    mockRects(
      { top: 90, bottom: 130, left: 400, right: 480 },
      { width: 120, height: 200 }
    );

    const { container } = render(() => (
      <Tooltip message="Flip" position="top">
        <button type="button">Target</button>
      </Tooltip>
    ));

    await fireEvent.mouseEnter(container.firstElementChild as HTMLElement);
    expect(screen.getByRole("tooltip").className).toContain("top-full");
  });

  test("flips from bottom to top when space below is tight", async () => {
    mockRects(
      { top: 700, bottom: 740, left: 400, right: 480 },
      { width: 120, height: 200 }
    );

    const { container } = render(() => (
      <Tooltip message="Flip up" position="bottom">
        <button type="button">Target</button>
      </Tooltip>
    ));

    await fireEvent.mouseEnter(container.firstElementChild as HTMLElement);
    expect(screen.getByRole("tooltip").className).toContain("bottom-full");
  });

  test("flips horizontally when right space is tight", async () => {
    mockRects(
      { top: 200, bottom: 240, left: 950, right: 1010 },
      { width: 200, height: 40 }
    );

    const { container } = render(() => (
      <Tooltip message="Flip left" position="right">
        <button type="button">Target</button>
      </Tooltip>
    ));

    await fireEvent.mouseEnter(container.firstElementChild as HTMLElement);
    expect(screen.getByRole("tooltip").className).toContain("right-full");
  });

  test("nudges horizontally when tooltip would overflow left edge", async () => {
    mockRects(
      { top: 200, bottom: 240, left: 4, right: 84 },
      { width: 200, height: 40 }
    );

    const { container } = render(() => (
      <Tooltip message="Nudge" position="top">
        <button type="button">Target</button>
      </Tooltip>
    ));

    await fireEvent.mouseEnter(container.firstElementChild as HTMLElement);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.style.transform).toContain("translateX");
  });

  test("recalculates position on focus in", async () => {
    mockRects(
      { top: 200, bottom: 240, left: 400, right: 480 },
      { width: 120, height: 40 }
    );

    const { container } = render(() => (
      <Tooltip message="Focus" position="left">
        <button type="button">Target</button>
      </Tooltip>
    ));

    await fireEvent.focusIn(container.firstElementChild as HTMLElement);
    expect(screen.getByRole("tooltip").className).toContain("right-full");
  });

  test("applies custom container class", () => {
    const { container } = render(() => (
      <Tooltip message="Styled" class="custom-tooltip">
        <span>Child</span>
      </Tooltip>
    ));
    expect(container.querySelector(".custom-tooltip")).toBeTruthy();
  });
});
