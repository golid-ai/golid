import { describe, test, expect } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  test("renders children", () => {
    render(() => <Tooltip message="Helpful hint"><button>Hover me</button></Tooltip>);
    expect(screen.getByText("Hover me")).toBeInTheDocument();
  });

  test("has tooltip role", () => {
    render(() => <Tooltip message="Info"><span>Target</span></Tooltip>);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  test("renders tooltip message text", () => {
    render(() => <Tooltip message="Click to save"><button>Save</button></Tooltip>);
    expect(screen.getByText("Click to save")).toBeInTheDocument();
  });

  test("sets aria-describedby on container", () => {
    const { container } = render(() => <Tooltip message="Hint"><span>Target</span></Tooltip>);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute("aria-describedby")).toBeTruthy();
  });

  test("tooltip id matches aria-describedby", () => {
    const { container } = render(() => <Tooltip message="Hint"><span>X</span></Tooltip>);
    const wrapper = container.firstElementChild as HTMLElement;
    const describedBy = wrapper.getAttribute("aria-describedby")!;
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.id).toBe(describedBy);
  });
});
