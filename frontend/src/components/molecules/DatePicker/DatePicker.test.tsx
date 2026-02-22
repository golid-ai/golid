import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { DatePicker } from "./DatePicker";

describe("DatePicker", () => {
  test("renders with placeholder when no value", () => {
    render(() => <DatePicker placeholder="Pick a date" label="Date" />);
    expect(screen.getByText("Pick a date")).toBeInTheDocument();
  });

  test("renders default placeholder when none provided", () => {
    render(() => <DatePicker label="Date" />);
    expect(screen.getByText("Select date...")).toBeInTheDocument();
  });

  test("displays formatted date when value is set", () => {
    const date = new Date(2025, 5, 15);
    render(() => <DatePicker value={date} label="Date" />);
    const formatted = date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    expect(screen.getByText(formatted)).toBeInTheDocument();
  });

  test("sets aria-label from label prop", () => {
    render(() => <DatePicker label="Start date" />);
    const trigger = screen.getByLabelText("Start date");
    expect(trigger.tagName).toBe("BUTTON");
  });

  test("opens calendar dropdown on click", async () => {
    render(() => <DatePicker label="Date" />);
    const trigger = screen.getByLabelText("Date");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("disabled state prevents opening", async () => {
    render(() => <DatePicker label="Date" disabled />);
    const trigger = screen.getByLabelText("Date");
    expect(trigger).toBeDisabled();
    await fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("onChange fires when a date is selected in the calendar", async () => {
    const onChange = vi.fn();
    render(() => <DatePicker label="Date" onChange={onChange} />);
    await fireEvent.click(screen.getByLabelText("Date"));
    const dayButtons = screen.getAllByRole("button", { name: /^[0-9]+$/ });
    const visibleDay = dayButtons.find((btn) => btn.textContent === "15");
    if (visibleDay) {
      await fireEvent.click(visibleDay);
      expect(onChange).toHaveBeenCalled();
      const arg = onChange.mock.calls[0][0];
      expect(arg).toBeInstanceOf(Date);
      expect(arg.getDate()).toBe(15);
    }
  });
});
