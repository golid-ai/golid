import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { RadioGroup, RadioGroupItem } from "./RadioGroup";

function RadioGroupHarness(props: { initial?: string }) {
  const [value, setValue] = createSignal(props.initial ?? "a");
  return (
    <RadioGroup value={value()} onChange={setValue} label="Test group">
      <div class="flex gap-2">
        <RadioGroupItem value="a" label="Option A" />
        <RadioGroupItem value="b" label="Option B" />
        <RadioGroupItem value="c" label="Option C" />
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
});
