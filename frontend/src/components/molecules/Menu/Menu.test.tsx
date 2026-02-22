import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Menu, MenuTrigger, MenuContent, MenuItem } from "./Menu";

describe("Menu", () => {
  it("renders trigger via render prop", () => {
    render(() => (
      <Menu>
        <MenuTrigger>
          {(attrs) => <button {...attrs}>Options</button>}
        </MenuTrigger>
        <MenuContent>
          <MenuItem onClick={() => {}}>Edit</MenuItem>
        </MenuContent>
      </Menu>
    ));
    expect(screen.getByText("Options")).toBeInTheDocument();
  });

  it("trigger has aria-haspopup", () => {
    render(() => (
      <Menu>
        <MenuTrigger>
          {(attrs) => <button {...attrs}>Menu</button>}
        </MenuTrigger>
        <MenuContent>
          <MenuItem onClick={() => {}}>Item</MenuItem>
        </MenuContent>
      </Menu>
    ));
    expect(screen.getByText("Menu")).toHaveAttribute("aria-haspopup", "true");
  });

  it("opens menu on trigger click", async () => {
    render(() => (
      <Menu>
        <MenuTrigger>
          {(attrs) => <button {...attrs}>Open</button>}
        </MenuTrigger>
        <MenuContent>
          <MenuItem onClick={() => {}}>Edit</MenuItem>
          <MenuItem onClick={() => {}}>Delete</MenuItem>
        </MenuContent>
      </Menu>
    ));
    await fireEvent.click(screen.getByText("Open"));
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("trigger starts with aria-expanded false", () => {
    render(() => (
      <Menu>
        <MenuTrigger>
          {(attrs) => <button {...attrs}>Toggle</button>}
        </MenuTrigger>
        <MenuContent>
          <MenuItem onClick={() => {}}>Action</MenuItem>
        </MenuContent>
      </Menu>
    ));
    expect(screen.getByText("Toggle")).toHaveAttribute("aria-expanded", "false");
  });
});
