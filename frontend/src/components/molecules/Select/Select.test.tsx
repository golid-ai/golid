import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import axe from "axe-core";
import { createSignal } from "solid-js";
import { Select, SelectItem } from "./Select";

function SelectHarness() {
  const [value, setValue] = createSignal<string | undefined>(undefined);
  return (
    <Select value={value()} onChange={setValue} placeholder="Pick one">
      <SelectItem value="apple" label="Apple">Apple</SelectItem>
      <SelectItem value="banana" label="Banana">Banana</SelectItem>
      <SelectItem value="cherry" label="Cherry">Cherry</SelectItem>
    </Select>
  );
}

describe("Select", () => {
  it("renders trigger with placeholder", () => {
    render(() => <SelectHarness />);
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  it("opens dropdown on trigger click", async () => {
    render(() => <SelectHarness />);
    await fireEvent.click(screen.getByText("Pick one"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.getByText("Cherry")).toBeInTheDocument();
  });

  it("renders with accessible label", () => {
    render(() => (
      <Select placeholder="Choose" label="Fruit picker">
        <SelectItem value="a" label="A">A</SelectItem>
      </Select>
    ));
    expect(screen.getByLabelText("Fruit picker")).toBeInTheDocument();
  });

  it("renders disabled state", () => {
    const { container } = render(() => (
      <Select placeholder="Disabled" disabled>
        <SelectItem value="a" label="A">A</SelectItem>
      </Select>
    ));
    const trigger = container.querySelector("button");
    expect(trigger).toBeDisabled();
  });

  it("has no a11y violations", async () => {
    const { container } = render(() => (
      <Select placeholder="Pick one" label="Fruit">
        <SelectItem value="apple" label="Apple">Apple</SelectItem>
        <SelectItem value="banana" label="Banana">Banana</SelectItem>
      </Select>
    ));
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
