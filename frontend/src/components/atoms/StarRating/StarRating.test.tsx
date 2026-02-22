import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { StarRating } from "./StarRating";

describe("StarRating", () => {
  it("renders 5 star buttons", () => {
    render(() => <StarRating value={3} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(5);
  });

  it("shows numeric value when showValue is true", () => {
    render(() => <StarRating value={4.5} showValue />);
    expect(screen.getByText("4.5")).toBeInTheDocument();
  });

  it("shows review count", () => {
    render(() => <StarRating value={3} reviewCount={12} />);
    expect(screen.getByText("(12 reviews)")).toBeInTheDocument();
  });

  it("calls onChange when star is clicked", async () => {
    const onChange = vi.fn();
    render(() => <StarRating value={2} onChange={onChange} />);
    const stars = screen.getAllByRole("button");
    await fireEvent.click(stars[3]);
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("disables buttons when not interactive", () => {
    render(() => <StarRating value={3} />);
    const stars = screen.getAllByRole("button");
    expect(stars[0]).toBeDisabled();
  });

  it("has accessible labels on stars", () => {
    render(() => <StarRating value={0} />);
    expect(screen.getByLabelText("1 star")).toBeInTheDocument();
    expect(screen.getByLabelText("3 stars")).toBeInTheDocument();
  });

  it("singular review text for count of 1", () => {
    render(() => <StarRating value={5} reviewCount={1} />);
    expect(screen.getByText("(1 review)")).toBeInTheDocument();
  });
});
