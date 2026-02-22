import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Slider } from "./Slider";

describe("Slider", () => {
  test("renders a range input with correct min, max, and value", () => {
    render(() => <Slider min={0} max={100} value={50} />);
    const input = screen.getByRole("slider");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "100");
    expect(input).toHaveValue("50");
  });

  test("uses default value of 50 when no value provided", () => {
    render(() => <Slider min={0} max={100} />);
    const input = screen.getByRole("slider");
    expect(input).toHaveValue("50");
  });

  test("renders with default min=0 and max=100 when not specified", () => {
    render(() => <Slider value={25} />);
    const input = screen.getByRole("slider");
    expect(input).toHaveAttribute("min", "0");
    expect(input).toHaveAttribute("max", "100");
  });

  test("step attribute is set correctly", () => {
    render(() => <Slider min={0} max={100} step={5} value={50} />);
    const input = screen.getByRole("slider");
    expect(input).toHaveAttribute("step", "5");
  });

  test("onChange fires when value changes", async () => {
    const onChange = vi.fn();
    render(() => <Slider min={0} max={100} value={50} onChange={onChange} />);
    const input = screen.getByRole("slider");
    await fireEvent.input(input, { target: { value: "75" } });
    expect(onChange).toHaveBeenCalledWith(75);
  });

  test("renders aria-label for single slider", () => {
    render(() => <Slider value={50} />);
    const input = screen.getByRole("slider");
    expect(input).toHaveAttribute("aria-label", "Value");
  });

  test("renders two range inputs for range mode", () => {
    render(() => <Slider value={[20, 80]} />);
    const inputs = screen.getAllByRole("slider");
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue("20");
    expect(inputs[1]).toHaveValue("80");
  });

  test("range mode labels thumbs as Minimum/Maximum value", () => {
    render(() => <Slider value={[10, 90]} />);
    expect(screen.getByLabelText("Minimum value")).toBeInTheDocument();
    expect(screen.getByLabelText("Maximum value")).toBeInTheDocument();
  });

  test("onChange fires with tuple in range mode", async () => {
    const onChange = vi.fn();
    render(() => <Slider value={[20, 80]} onChange={onChange} />);
    const inputs = screen.getAllByRole("slider");
    await fireEvent.input(inputs[0], { target: { value: "30" } });
    expect(onChange).toHaveBeenCalledWith([30, 80]);
  });
});
