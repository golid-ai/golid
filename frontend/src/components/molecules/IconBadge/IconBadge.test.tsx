import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { IconBadge } from "./IconBadge";

describe("IconBadge", () => {
  it("renders icon and badge value", () => {
    render(() => <IconBadge icon="notifications" value={5} />);
    expect(screen.getByText("notifications")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("truncates badge value at max", () => {
    render(() => <IconBadge icon="mail" value={150} max={99} />);
    expect(screen.getByText("99+")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(() => <IconBadge icon="inbox" label="Messages" value={3} />);
    expect(screen.getByText("Messages")).toBeInTheDocument();
  });

  it("calls onClick handler", async () => {
    const onClick = vi.fn();
    render(() => <IconBadge icon="bell" value={1} onClick={onClick} />);
    const button = screen.getByRole("button");
    await fireEvent.click(button);
    expect(onClick).toHaveBeenCalled();
  });
});
