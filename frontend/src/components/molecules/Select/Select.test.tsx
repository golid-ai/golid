import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import axe from "axe-core";
import { createSignal } from "solid-js";
import { Select, SelectItem } from "./Select";

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(cleanup);

function SelectHarness(props: { initial?: string }) {
  const [value, setValue] = createSignal<string | undefined>(props.initial);
  return (
    <>
      <Select value={value()} onChange={setValue} placeholder="Pick one">
        <SelectItem value="apple" label="Apple">
          Apple
        </SelectItem>
        <SelectItem value="banana" label="Banana">
          Banana
        </SelectItem>
        <SelectItem value="cherry" label="Cherry">
          Cherry
        </SelectItem>
      </Select>
      <span data-testid="selected-value">{value() ?? "none"}</span>
    </>
  );
}

describe("Select", () => {
  it("renders trigger with placeholder", () => {
    render(() => <SelectHarness />);
    expect(screen.getByText("Pick one")).toBeInTheDocument();
  });

  it("opens dropdown on trigger click", async () => {
    render(() => <SelectHarness />);
    await fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.getByText("Cherry")).toBeInTheDocument();
  });

  it("selects an item and shows label instead of placeholder", async () => {
    render(() => <SelectHarness />);
    await fireEvent.click(screen.getByRole("combobox"));
    await fireEvent.click(screen.getByRole("option", { name: "Banana" }));

    await waitFor(() => {
      expect(screen.getByTestId("selected-value")).toHaveTextContent("banana");
      expect(screen.getByRole("combobox")).toHaveTextContent("Banana");
    });
    expect(screen.queryByText("Pick one")).toBeNull();
  });

  it("shows selected value on trigger when value prop is set", () => {
    render(() => <SelectHarness initial="cherry" />);
    expect(screen.getByRole("combobox")).toHaveTextContent("Cherry");
    expect(screen.queryByText("Pick one")).toBeNull();
  });

  it("renders with accessible label", () => {
    render(() => (
      <Select placeholder="Choose" label="Fruit picker">
        <SelectItem value="a" label="A">
          A
        </SelectItem>
      </Select>
    ));
    expect(screen.getByLabelText("Fruit picker")).toBeInTheDocument();
  });

  it("renders disabled state and does not open on click", async () => {
    render(() => (
      <Select placeholder="Disabled" disabled>
        <SelectItem value="a" label="A">
          A
        </SelectItem>
      </Select>
    ));
    const trigger = screen.getByRole("combobox");
    expect(trigger).toBeDisabled();

    await fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("navigates options with keyboard and selects with Enter", async () => {
    render(() => <SelectHarness />);
    const trigger = screen.getByRole("combobox");
    trigger.focus();

    await fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
      expect(trigger).toHaveAttribute("aria-activedescendant");
    });

    await fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await fireEvent.keyDown(trigger, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("selected-value")).toHaveTextContent("banana");
    });
  });

  it("closes dropdown on Escape", async () => {
    render(() => <SelectHarness />);
    const trigger = screen.getByRole("combobox");
    await fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await fireEvent.keyDown(trigger, { key: "Escape" });
    await waitFor(() => {
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("jumps to first and last options with Home and End", async () => {
    render(() => <SelectHarness />);
    const trigger = screen.getByRole("combobox");
    trigger.focus();
    await fireEvent.keyDown(trigger, { key: "ArrowDown" });

    await fireEvent.keyDown(trigger, { key: "End" });
    await fireEvent.keyDown(trigger, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getByTestId("selected-value")).toHaveTextContent("cherry");
    });
  });

  it("has no a11y violations", async () => {
    const { container } = render(() => (
      <Select placeholder="Pick one" label="Fruit">
        <SelectItem value="apple" label="Apple">
          Apple
        </SelectItem>
        <SelectItem value="banana" label="Banana">
          Banana
        </SelectItem>
      </Select>
    ));
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});
