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
});
