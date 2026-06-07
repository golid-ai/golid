import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { RadioGroup, RadioGroupItem } from "./RadioGroup";

function RadioGroupHarness(props: {
  initial?: string;
  withDisabled?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const [value, setValue] = createSignal(props.initial ?? "a");
  return (
    <RadioGroup value={value()} onChange={setValue} label="Test group">
      <div class="flex gap-2">
        <RadioGroupItem value="a" label="Option A" size={props.size} />
        <RadioGroupItem value="b" label="Option B" size={props.size} />
        <RadioGroupItem value="c" label="Option C" size={props.size} disabled={props.withDisabled} />
      </div>
    </RadioGroup>
  );
}

describe("RadioGroup", () => {
  it("renders radiogroup role", () => {
    render(() => <RadioGroupHarness />);
    expect(screen.getByRole("radiogroup")).toBeInTheDocument();
  });

  it("renders radio items", () => {
    render(() => <RadioGroupHarness />);
    const radios = screen.getAllByRole("radio");
    expect(radios.length).toBe(3);
  });

  it("selects initial value", () => {
    render(() => <RadioGroupHarness initial="b" />);
    const radios = screen.getAllByRole("radio");
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
    expect(radios[0]).toHaveAttribute("aria-checked", "false");
  });

  it("changes selection on click", async () => {
    render(() => <RadioGroupHarness initial="a" />);
    const radios = screen.getAllByRole("radio");

    await fireEvent.click(radios[2]);
    expect(radios[2]).toHaveAttribute("aria-checked", "true");
    expect(radios[0]).toHaveAttribute("aria-checked", "false");
  });

  it("has accessible label", () => {
    render(() => <RadioGroupHarness />);
    expect(screen.getByLabelText("Test group")).toBeInTheDocument();
  });

  it("navigates with ArrowDown and ArrowRight", async () => {
    render(() => <RadioGroupHarness initial="a" />);
    const radios = screen.getAllByRole("radio");
    radios[0].focus();

    await fireEvent.keyDown(radios[0], { key: "ArrowDown" });
    expect(radios[1]).toHaveAttribute("aria-checked", "true");

    await fireEvent.keyDown(radios[1], { key: "ArrowRight" });
    expect(radios[2]).toHaveAttribute("aria-checked", "true");
  });

  it("navigates with ArrowUp and ArrowLeft", async () => {
    render(() => <RadioGroupHarness initial="b" />);
    const radios = screen.getAllByRole("radio");
    radios[1].focus();

    await fireEvent.keyDown(radios[1], { key: "ArrowUp" });
    expect(radios[0]).toHaveAttribute("aria-checked", "true");

    await fireEvent.keyDown(radios[0], { key: "ArrowLeft" });
    expect(radios[2]).toHaveAttribute("aria-checked", "true");
  });

  it("jumps to first and last options with Home and End", async () => {
    render(() => <RadioGroupHarness initial="b" />);
    const radios = screen.getAllByRole("radio");
    radios[1].focus();

    await fireEvent.keyDown(radios[1], { key: "Home" });
    expect(radios[0]).toHaveAttribute("aria-checked", "true");

    await fireEvent.keyDown(radios[0], { key: "End" });
    expect(radios[2]).toHaveAttribute("aria-checked", "true");
  });

  it("skips disabled options during keyboard navigation", async () => {
    render(() => <RadioGroupHarness initial="a" withDisabled />);
    const radios = screen.getAllByRole("radio");
    radios[0].focus();

    await fireEvent.keyDown(radios[0], { key: "ArrowDown" });
    expect(radios[1]).toHaveAttribute("aria-checked", "true");
    expect(radios[2]).toBeDisabled();
  });

  it("renders size variants", () => {
    const { container } = render(() => <RadioGroupHarness size="lg" />);
    const button = container.querySelector("button")!;
    expect(button.className).toContain("h-7");
  });

  it("does not select disabled option on click", async () => {
    render(() => <RadioGroupHarness initial="a" withDisabled />);
    const radios = screen.getAllByRole("radio");

    await fireEvent.click(radios[2]);
    expect(radios[0]).toHaveAttribute("aria-checked", "true");
    expect(radios[2]).toHaveAttribute("aria-checked", "false");
  });
});
