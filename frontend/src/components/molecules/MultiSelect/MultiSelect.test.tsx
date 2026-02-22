import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { MultiSelect, MultiSelectItem } from "./MultiSelect";

function MultiSelectHarness() {
  const [value, setValue] = createSignal<string[]>([]);
  return (
    <MultiSelect value={value()} onChange={setValue} placeholder="Select items">
      <MultiSelectItem value="alpha" label="Alpha">Alpha</MultiSelectItem>
      <MultiSelectItem value="beta" label="Beta">Beta</MultiSelectItem>
      <MultiSelectItem value="gamma" label="Gamma">Gamma</MultiSelectItem>
    </MultiSelect>
  );
}

describe("MultiSelect", () => {
  it("renders trigger with placeholder", () => {
    render(() => <MultiSelectHarness />);
    expect(screen.getByText("Select items")).toBeInTheDocument();
  });

  it("opens dropdown on trigger click", async () => {
    render(() => <MultiSelectHarness />);
    await fireEvent.click(screen.getByText("Select items"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("renders with accessible label", () => {
    render(() => (
      <MultiSelect placeholder="Choose" label="Tag picker">
        <MultiSelectItem value="a" label="A">A</MultiSelectItem>
      </MultiSelect>
    ));
    expect(screen.getByLabelText("Tag picker")).toBeInTheDocument();
  });

  it("renders in disabled state", () => {
    const { container } = render(() => (
      <MultiSelect placeholder="Disabled" disabled>
        <MultiSelectItem value="a" label="A">A</MultiSelectItem>
      </MultiSelect>
    ));
    expect(container.querySelector("[class*=disabled], [class*=cursor-not-allowed]") ||
           container.querySelector("button[disabled]")).toBeTruthy();
  });
});
