import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { TimePicker } from "./TimePicker";

describe("TimePicker", () => {
  test("renders placeholder when no value", () => {
    render(() => <TimePicker placeholder="Pick time" />);
    expect(screen.getByText("Pick time")).toBeInTheDocument();
  });

  test("renders default placeholder when none provided and no value", () => {
    render(() => <TimePicker />);
    expect(screen.getByText("Select time...")).toBeInTheDocument();
  });

  test("displays formatted 12-hour time when value is set", () => {
    render(() => <TimePicker value="14:30" />);
    expect(screen.getByText("02:30 PM")).toBeInTheDocument();
  });

  test("displays 12:00 AM for midnight", () => {
    render(() => <TimePicker value="00:00" />);
    expect(screen.getByText("12:00 AM")).toBeInTheDocument();
  });

  test("displays 12:00 PM for noon", () => {
    render(() => <TimePicker value="12:00" />);
    expect(screen.getByText("12:00 PM")).toBeInTheDocument();
  });

  test("opens time panel on click", async () => {
    render(() => <TimePicker value="09:00" />);
    const trigger = screen.getByRole("button", { name: /09:00 AM/i });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("disabled state prevents opening", async () => {
    render(() => <TimePicker value="09:00" disabled />);
    const trigger = screen.getByText("09:00 AM").closest("button")!;
    expect(trigger).toBeDisabled();
    await fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("increase hours button calls onChange", async () => {
    const onChange = vi.fn();
    render(() => <TimePicker value="09:00" onChange={onChange} />);
    await fireEvent.click(screen.getByRole("button", { name: /09:00 AM/i }));
    await fireEvent.click(screen.getByLabelText("Increase hours"));
    expect(onChange).toHaveBeenCalledWith("10:00");
  });

  test("decrease hours button wraps around midnight", async () => {
    const onChange = vi.fn();
    render(() => <TimePicker value="00:00" onChange={onChange} />);
    await fireEvent.click(screen.getByText("12:00 AM"));
    await fireEvent.click(screen.getByLabelText("Decrease hours"));
    expect(onChange).toHaveBeenCalledWith("23:00");
  });

  test("increase minutes button calls onChange with 5-minute step", async () => {
    const onChange = vi.fn();
    render(() => <TimePicker value="09:00" onChange={onChange} />);
    await fireEvent.click(screen.getByText("09:00 AM"));
    await fireEvent.click(screen.getByLabelText("Increase minutes"));
    expect(onChange).toHaveBeenCalledWith("09:05");
  });
});
