import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { DateRangePicker } from "./DateRangePicker";

describe("DateRangePicker", () => {
  test("renders with placeholder when no value", () => {
    render(() => <DateRangePicker placeholder="Choose dates" label="Range" />);
    expect(screen.getByText("Choose dates")).toBeInTheDocument();
  });

  test("renders default placeholder when none provided", () => {
    render(() => <DateRangePicker label="Range" />);
    expect(screen.getByText("Select dates...")).toBeInTheDocument();
  });

  test("displays formatted range when both start and end are set", () => {
    const start = new Date(2025, 5, 10);
    const end = new Date(2025, 5, 20);
    render(() => <DateRangePicker value={{ start, end }} label="Range" />);
    const formatDate = (d: Date) =>
      d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const expected = `${formatDate(start)} - ${formatDate(end)}`;
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  test("displays partial range when only start is set", () => {
    const start = new Date(2025, 5, 10);
    render(() => <DateRangePicker value={{ start, end: null }} label="Range" />);
    const formatted = start.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    expect(screen.getByText(`${formatted} - ...`)).toBeInTheDocument();
  });

  test("sets aria-label from label prop", () => {
    render(() => <DateRangePicker label="Date range" />);
    const trigger = screen.getByLabelText("Date range");
    expect(trigger.tagName).toBe("BUTTON");
  });

  test("opens calendar dropdown on click", async () => {
    render(() => <DateRangePicker label="Range" />);
    const trigger = screen.getByLabelText("Range");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    await fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("disabled state prevents opening", async () => {
    render(() => <DateRangePicker label="Range" disabled />);
    const trigger = screen.getByLabelText("Range");
    expect(trigger).toBeDisabled();
    await fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("onChange fires with range object when dates are selected", async () => {
    const onChange = vi.fn();
    render(() => <DateRangePicker label="Range" onChange={onChange} />);
    await fireEvent.click(screen.getByLabelText("Range"));
    const dayButtons = screen.getAllByRole("button", { name: /^[0-9]+$/ });
    const day10 = dayButtons.find((btn) => btn.textContent === "10");
    const day20 = dayButtons.find((btn) => btn.textContent === "20");
    if (day10 && day20) {
      await fireEvent.click(day10);
      expect(onChange).toHaveBeenCalled();
      const firstCall = onChange.mock.calls[0][0];
      expect(firstCall).toHaveProperty("start");
      expect(firstCall.start).toBeInstanceOf(Date);
    }
  });
});
