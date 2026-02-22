import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Calendar } from "./Calendar";

describe("Calendar", () => {
  test("renders current month name and year in header", () => {
    const now = new Date();
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    render(() => <Calendar />);
    expect(screen.getByText(monthNames[now.getMonth()])).toBeInTheDocument();
    expect(screen.getByText(String(now.getFullYear()))).toBeInTheDocument();
  });

  test("renders day-of-week headers", () => {
    render(() => <Calendar />);
    for (const day of ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
  });

  test("renders the value date's month when a value is provided", () => {
    const date = new Date(2024, 0, 15); // January 2024
    render(() => <Calendar value={date} mode="single" />);
    expect(screen.getByText("January")).toBeInTheDocument();
    expect(screen.getByText("2024")).toBeInTheDocument();
  });

  test("navigates to next month", async () => {
    render(() => <Calendar value={new Date(2025, 0, 1)} mode="single" />);
    expect(screen.getByText("January")).toBeInTheDocument();
    await fireEvent.click(screen.getByLabelText("Next month"));
    expect(screen.getByText("February")).toBeInTheDocument();
  });

  test("navigates to previous month", async () => {
    render(() => <Calendar value={new Date(2025, 1, 1)} mode="single" />);
    expect(screen.getByText("February")).toBeInTheDocument();
    await fireEvent.click(screen.getByLabelText("Previous month"));
    expect(screen.getByText("January")).toBeInTheDocument();
  });

  test("selecting a date calls onSelect in single mode", async () => {
    const onSelect = vi.fn();
    render(() => <Calendar value={new Date(2025, 5, 1)} mode="single" onSelect={onSelect} />);
    const dayButtons = screen.getAllByRole("button", { name: /^[0-9]+$/ });
    const day15 = dayButtons.find((btn) => btn.textContent === "15");
    if (day15) {
      await fireEvent.click(day15);
      expect(onSelect).toHaveBeenCalled();
      const selectedDate = onSelect.mock.calls[0][0] as Date;
      expect(selectedDate.getDate()).toBe(15);
      expect(selectedDate.getMonth()).toBe(5);
    }
  });

  test("Today button calls onSelect with today's date", async () => {
    const onSelect = vi.fn();
    render(() => <Calendar mode="single" onSelect={onSelect} />);
    await fireEvent.click(screen.getByText("Today"));
    expect(onSelect).toHaveBeenCalled();
    const selected = onSelect.mock.calls[0][0] as Date;
    const today = new Date();
    expect(selected.getDate()).toBe(today.getDate());
    expect(selected.getMonth()).toBe(today.getMonth());
  });

  test("Clear button calls onSelect with null", async () => {
    const onSelect = vi.fn();
    const date = new Date(2025, 5, 15);
    render(() => <Calendar value={date} mode="single" onSelect={onSelect} />);
    await fireEvent.click(screen.getByText("Clear"));
    expect(onSelect).toHaveBeenCalledWith(null, false);
  });

  test("has grid role with Calendar label", () => {
    render(() => <Calendar />);
    expect(screen.getByRole("grid", { name: "Calendar" })).toBeInTheDocument();
  });
});
