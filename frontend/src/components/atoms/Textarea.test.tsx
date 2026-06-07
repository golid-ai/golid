import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  test("renders with placeholder", () => {
    render(() => <Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  test("displays value", () => {
    render(() => <Textarea value="Hello world" />);
    expect(screen.getByDisplayValue("Hello world")).toBeInTheDocument();
  });

  test("fires onInput event", async () => {
    const onInput = vi.fn();
    render(() => <Textarea placeholder="Type here" onInput={onInput} />);
    await fireEvent.input(screen.getByPlaceholderText("Type here"), {
      target: { value: "new text" },
    });
    expect(onInput).toHaveBeenCalled();
  });

  test("renders disabled state", () => {
    render(() => <Textarea placeholder="Disabled" disabled />);
    expect(screen.getByPlaceholderText("Disabled")).toBeDisabled();
  });

  test("applies error variant", () => {
    const { container } = render(() => <Textarea variant="error" placeholder="Error" />);
    const textarea = container.querySelector("textarea")!;
    expect(textarea.className).toContain("danger");
  });

  test("renders sm size", () => {
    const { container } = render(() => <Textarea size="sm" placeholder="Small" />);
    expect(container.querySelector("textarea")).toBeTruthy();
  });

  test("renders lg size", () => {
    const { container } = render(() => <Textarea size="lg" placeholder="Large" />);
    expect(container.querySelector("textarea")).toBeTruthy();
  });

  test("supports readonly", () => {
    render(() => <Textarea placeholder="Read only" readOnly />);
    expect(screen.getByPlaceholderText("Read only")).toHaveAttribute("readonly");
  });

  test("renders md size", () => {
    const { container } = render(() => <Textarea size="md" placeholder="Medium" />);
    const textarea = container.querySelector("textarea")!;
    expect(textarea.className).toContain("min-h-[120px]");
  });

  test("autoGrow adjusts height on input", async () => {
    const { container } = render(() => <Textarea autoGrow placeholder="Growing" />);
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    Object.defineProperty(textarea, "scrollHeight", { configurable: true, value: 120 });

    await fireEvent.input(textarea, { target: { value: "Line one\nLine two" } });
    expect(textarea.style.height).toBe("120px");
    expect(textarea.className).toContain("resize-none");
    expect(textarea.className).toContain("overflow-hidden");
  });

  test("autoGrow uses compact min height for sm size", () => {
    const { container } = render(() => <Textarea autoGrow size="sm" placeholder="Compact" />);
    const textarea = container.querySelector("textarea")!;
    expect(textarea.className).toContain("min-h-[38px]");
    expect(textarea).toHaveAttribute("rows", "1");
  });

  test("autoGrow uses lg min height", () => {
    const { container } = render(() => <Textarea autoGrow size="lg" placeholder="Large grow" />);
    const textarea = container.querySelector("textarea")!;
    expect(textarea.className).toContain("min-h-[120px]");
  });

  test("shows mobile resize handle when autoGrow is disabled", () => {
    const { container } = render(() => <Textarea placeholder="Resizable" />);
    expect(container.querySelector(".textarea-resize")).toBeTruthy();
    expect(container.querySelector("svg")).toBeTruthy();
  });

  test("touch resize updates textarea height", async () => {
    const { container } = render(() => <Textarea placeholder="Touch resize" />);
    const textarea = container.querySelector("textarea") as HTMLTextAreaElement;
    Object.defineProperty(textarea, "offsetHeight", { configurable: true, value: 100 });

    const handle = container.querySelector("[class*='cursor-ns-resize']") as HTMLElement;
    await fireEvent.touchStart(handle, {
      touches: [{ clientY: 100 } as Touch],
    });
    await fireEvent.touchMove(document, {
      touches: [{ clientY: 140 } as Touch],
    });
    await fireEvent.touchEnd(document);

    expect(textarea.style.height).toBe("140px");
  });
});
