import { describe, it, expect, afterEach, beforeEach, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { MultiSelect, MultiSelectItem } from "./MultiSelect";

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(cleanup);

function MultiSelectHarness(props: { initial?: string[] }) {
  const [value, setValue] = createSignal<string[]>(props.initial ?? []);
  return (
    <>
      <MultiSelect value={value()} onChange={setValue} placeholder="Select items">
        <MultiSelectItem value="alpha" label="Alpha">
          Alpha
        </MultiSelectItem>
        <MultiSelectItem value="beta" label="Beta">
          Beta
        </MultiSelectItem>
        <MultiSelectItem value="gamma" label="Gamma">
          Gamma
        </MultiSelectItem>
      </MultiSelect>
      <span data-testid="selected-values">{value().join(",") || "none"}</span>
    </>
  );
}

describe("MultiSelect", () => {
  it("renders trigger with placeholder when empty", () => {
    render(() => <MultiSelectHarness />);
    expect(screen.getByText("Select items")).toBeInTheDocument();
    expect(screen.getByTestId("selected-values")).toHaveTextContent("none");
  });

  it("opens dropdown on trigger click", async () => {
    render(() => <MultiSelectHarness />);
    await fireEvent.click(screen.getByRole("combobox"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Alpha" })).toBeInTheDocument();
  });

  it("selects and deselects items", async () => {
    render(() => <MultiSelectHarness />);
    await fireEvent.click(screen.getByRole("combobox"));

    const alpha = screen.getByRole("option", { name: "Alpha" });
    await fireEvent.click(alpha);
    await waitFor(() => {
      expect(screen.getByTestId("selected-values")).toHaveTextContent("alpha");
      expect(alpha).toHaveAttribute("aria-selected", "true");
    });

    await fireEvent.click(alpha);
    await waitFor(() => {
      expect(screen.getByTestId("selected-values")).toHaveTextContent("none");
      expect(screen.getByText("Select items")).toBeInTheDocument();
    });
  });

  it("clears a selection via chip remove button", async () => {
    render(() => <MultiSelectHarness initial={["alpha", "beta"]} />);
    expect(screen.getByTestId("selected-values")).toHaveTextContent("alpha,beta");

    const removeButtons = screen.getAllByRole("button");
    await fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.getByTestId("selected-values")).toHaveTextContent("beta");
    });
  });

  it("selects multiple items and shows chips", async () => {
    render(() => <MultiSelectHarness />);
    await fireEvent.click(screen.getByRole("combobox"));
    await fireEvent.click(screen.getByRole("option", { name: "Alpha" }));
    await fireEvent.click(screen.getByRole("option", { name: "Gamma" }));

    await waitFor(() => {
      expect(screen.getByTestId("selected-values")).toHaveTextContent("alpha,gamma");
    });
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  it("renders with accessible label", () => {
    render(() => (
      <MultiSelect placeholder="Choose" label="Tag picker">
        <MultiSelectItem value="a" label="A">
          A
        </MultiSelectItem>
      </MultiSelect>
    ));
    expect(screen.getByLabelText("Tag picker")).toBeInTheDocument();
  });

  it("does not open when disabled", async () => {
    render(() => (
      <MultiSelect placeholder="Disabled" disabled>
        <MultiSelectItem value="a" label="A">
          A
        </MultiSelectItem>
      </MultiSelect>
    ));
    const trigger = screen.getByRole("combobox");
    await fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("navigates options with keyboard and toggles with Space", async () => {
    render(() => <MultiSelectHarness />);
    const trigger = screen.getByRole("combobox");
    trigger.focus();

    await fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    await fireEvent.keyDown(trigger, { key: " " });
    await waitFor(() => {
      expect(screen.getByTestId("selected-values")).toHaveTextContent("alpha");
    });

    await fireEvent.keyDown(trigger, { key: " " });
    await waitFor(() => {
      expect(screen.getByTestId("selected-values")).toHaveTextContent("none");
    });
  });

  it("closes dropdown on Escape", async () => {
    render(() => <MultiSelectHarness />);
    const trigger = screen.getByRole("combobox");
    await fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await fireEvent.keyDown(trigger, { key: "Escape" });
    await waitFor(() => {
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  });
});
