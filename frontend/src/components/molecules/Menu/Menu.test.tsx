import { afterEach, beforeAll, describe, it, expect, vi } from "vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@solidjs/testing-library";
import {
  Menu,
  MenuTrigger,
  MenuContent,
  MenuItem,
  MenuSeparator,
  Submenu,
  SubmenuTrigger,
  SubmenuContent,
} from "./Menu";

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(cleanup);

function BasicMenu(props: { onEdit?: () => void; onDelete?: () => void }) {
  return (
    <Menu>
      <MenuTrigger>
        {(attrs) => <button {...attrs}>Options</button>}
      </MenuTrigger>
      <MenuContent>
        <MenuItem onClick={props.onEdit}>Edit</MenuItem>
        <MenuItem onClick={props.onDelete}>Delete</MenuItem>
      </MenuContent>
    </Menu>
  );
}

function MenuWithSubmenu(props: { onSubAction?: () => void }) {
  return (
    <Menu>
      <MenuTrigger>
        {(attrs) => <button {...attrs}>Open menu</button>}
      </MenuTrigger>
      <MenuContent>
        <MenuItem onClick={() => {}}>Edit</MenuItem>
        <Submenu>
          <SubmenuTrigger>More options</SubmenuTrigger>
          <SubmenuContent>
            <MenuItem onClick={props.onSubAction}>Sub action</MenuItem>
            <MenuItem onClick={() => {}}>Another sub</MenuItem>
          </SubmenuContent>
        </Submenu>
      </MenuContent>
    </Menu>
  );
}

describe("Menu", () => {
  it("renders trigger via render prop", () => {
    render(() => <BasicMenu />);
    expect(screen.getByText("Options")).toBeInTheDocument();
  });

  it("trigger has aria-haspopup", () => {
    render(() => <BasicMenu />);
    expect(screen.getByText("Options")).toHaveAttribute("aria-haspopup", "true");
  });

  it("opens menu on trigger click", async () => {
    render(() => <BasicMenu />);
    await fireEvent.click(screen.getByText("Options"));
    expect(screen.getByText("Edit")).toBeInTheDocument();
    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("trigger starts with aria-expanded false", () => {
    render(() => <BasicMenu />);
    expect(screen.getByText("Options")).toHaveAttribute("aria-expanded", "false");
  });

  it("links trigger aria-controls to visible menu when open", async () => {
    render(() => <BasicMenu />);
    const trigger = screen.getByRole("button", { name: "Options" });
    const menuId = trigger.getAttribute("aria-controls");
    expect(menuId).toBeTruthy();

    await fireEvent.click(trigger);
    await waitFor(() => {
      expect(document.getElementById(menuId!)).toBeInTheDocument();
    });

    await fireEvent.keyDown(trigger, { key: "Escape" });
    await waitFor(() => {
      expect(document.getElementById(menuId!)).not.toBeInTheDocument();
    });
  });

  it("sets aria-expanded false when menu closes", async () => {
    render(() => <BasicMenu />);
    const trigger = () => screen.getByRole("button", { name: "Options" });
    await fireEvent.click(trigger());
    await fireEvent.keyDown(trigger(), { key: "Escape" });
    await waitFor(() => {
      expect(trigger()).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("calls item onClick handler when item is clicked", async () => {
    const onEdit = vi.fn();
    render(() => <BasicMenu onEdit={onEdit} />);
    await fireEvent.click(screen.getByText("Options"));
    await fireEvent.click(screen.getByText("Edit"));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
  });

  it("opens menu on ArrowDown from closed trigger", async () => {
    render(() => <BasicMenu />);
    await fireEvent.keyDown(screen.getByRole("button", { name: "Options" }), {
      key: "ArrowDown",
    });
    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
    });
  });

  it("opens menu on ArrowUp from closed trigger and focuses last item", async () => {
    render(() => <BasicMenu />);
    await fireEvent.keyDown(screen.getByRole("button", { name: "Options" }), {
      key: "ArrowUp",
    });
    await waitFor(() => {
      expect(screen.getByText("Delete")).toBeInTheDocument();
      expect(screen.getByText("Delete")).toHaveAttribute("tabindex", "0");
    });
  });

  it("moves active item with ArrowDown and ArrowUp when open", async () => {
    render(() => <BasicMenu />);
    await fireEvent.keyDown(screen.getByRole("button", { name: "Options" }), {
      key: "ArrowDown",
    });
    await waitFor(() => {
      expect(screen.getByText("Edit")).toHaveAttribute("tabindex", "0");
    });

    await fireEvent.keyDown(screen.getByText("Edit"), { key: "ArrowDown" });
    await waitFor(() => {
      expect(screen.getByText("Delete")).toHaveAttribute("tabindex", "0");
    });

    await fireEvent.keyDown(screen.getByText("Delete"), { key: "ArrowUp" });
    await waitFor(() => {
      expect(screen.getByText("Edit")).toHaveAttribute("tabindex", "0");
    });
  });

  it("closes menu on Escape", async () => {
    render(() => <BasicMenu />);
    const trigger = () => screen.getByRole("button", { name: "Options" });
    await fireEvent.click(trigger());
    await fireEvent.keyDown(trigger(), { key: "Escape" });
    await waitFor(() => {
      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    });
  });

  it("closes menu on outside mousedown", async () => {
    render(() => (
      <div>
        <BasicMenu />
        <button type="button">Outside</button>
      </div>
    ));
    await fireEvent.click(screen.getByRole("button", { name: "Options" }));
    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
    });
    await fireEvent.mouseDown(screen.getByRole("button", { name: "Outside" }));
    await waitFor(() => {
      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    });
  });

  describe("Submenu", () => {
    function submenuTrigger() {
      return screen.getByText("More options").closest('[role="menuitem"]') as HTMLElement;
    }

    it("renders SubmenuTrigger and SubmenuContent when submenu opens", async () => {
      render(() => <MenuWithSubmenu />);
      await fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
      expect(screen.getByText("More options")).toBeInTheDocument();

      await fireEvent.click(submenuTrigger());
      await waitFor(() => {
        expect(screen.getByText("Sub action")).toBeInTheDocument();
      });
    });

    it("SubmenuTrigger toggles aria-expanded", async () => {
      render(() => <MenuWithSubmenu />);
      await fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
      expect(submenuTrigger()).toHaveAttribute("aria-expanded", "false");

      await fireEvent.click(submenuTrigger());
      await waitFor(() => {
        expect(submenuTrigger()).toHaveAttribute("aria-expanded", "true");
      });
    });

    it("opens submenu on ArrowRight from SubmenuTrigger", async () => {
      render(() => <MenuWithSubmenu />);
      await fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
      await fireEvent.keyDown(submenuTrigger(), { key: "ArrowRight" });
      await waitFor(() => {
        expect(screen.getByText("Sub action")).toBeInTheDocument();
      });
    });

    it("closes submenu on ArrowLeft", async () => {
      render(() => <MenuWithSubmenu />);
      await fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
      await fireEvent.keyDown(submenuTrigger(), { key: "ArrowRight" });
      await waitFor(() => {
        expect(screen.getByText("Sub action")).toBeInTheDocument();
      });

      await fireEvent.keyDown(submenuTrigger(), { key: "ArrowLeft" });
      await waitFor(() => {
        expect(screen.queryByText("Sub action")).not.toBeInTheDocument();
      });
    });

    it("closes submenu on Escape without closing parent menu", async () => {
      render(() => <MenuWithSubmenu />);
      await fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
      await fireEvent.keyDown(submenuTrigger(), { key: "ArrowRight" });
      await waitFor(() => {
        expect(screen.getByText("Sub action")).toBeInTheDocument();
      });

      await fireEvent.keyDown(submenuTrigger(), { key: "Escape" });
      await waitFor(() => {
        expect(screen.queryByText("Sub action")).not.toBeInTheDocument();
      });
      expect(screen.getByText("Edit")).toBeInTheDocument();
    });

    it("navigates submenu items with ArrowDown and ArrowUp", async () => {
      render(() => <MenuWithSubmenu />);
      await fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
      await fireEvent.keyDown(submenuTrigger(), { key: "ArrowRight" });

      const subAction = () => screen.getByText("Sub action");
      await waitFor(() => {
        expect(subAction()).toHaveAttribute("tabindex", "0");
      });

      await fireEvent.keyDown(subAction(), { key: "ArrowDown" });
      await waitFor(() => {
        expect(screen.getByText("Another sub")).toHaveAttribute("tabindex", "0");
      });

      await fireEvent.keyDown(screen.getByText("Another sub"), { key: "ArrowUp" });
      await waitFor(() => {
        expect(subAction()).toHaveAttribute("tabindex", "0");
      });
    });

    it("calls submenu item onClick handler", async () => {
      const onSubAction = vi.fn();
      render(() => <MenuWithSubmenu onSubAction={onSubAction} />);
      await fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
      await fireEvent.click(submenuTrigger());
      await waitFor(() => {
        expect(screen.getByText("Sub action")).toBeInTheDocument();
      });
      await fireEvent.click(screen.getByText("Sub action"));
      expect(onSubAction).toHaveBeenCalledTimes(1);
    });

    it("opens submenu on Enter from SubmenuTrigger", async () => {
      render(() => <MenuWithSubmenu />);
      await fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
      await fireEvent.keyDown(submenuTrigger(), { key: "Enter" });
      await waitFor(() => {
        expect(screen.getByText("Sub action")).toBeInTheDocument();
      });
    });

    it("activates submenu item with Space and closes menus", async () => {
      const onSubAction = vi.fn();
      render(() => <MenuWithSubmenu onSubAction={onSubAction} />);
      await fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
      await fireEvent.keyDown(submenuTrigger(), { key: "ArrowRight" });
      await waitFor(() => {
        expect(screen.getByText("Sub action")).toBeInTheDocument();
      });

      const subAction = screen.getByText("Sub action");
      await fireEvent.keyDown(subAction, { key: " " });
      expect(onSubAction).toHaveBeenCalledTimes(1);
      await waitFor(() => {
        expect(screen.queryByText("Sub action")).not.toBeInTheDocument();
      });
    });

    it("opens submenu on mouse enter and closes after mouse leave", async () => {
      vi.useFakeTimers();
      render(() => <MenuWithSubmenu />);
      await fireEvent.click(screen.getByRole("button", { name: "Open menu" }));

      await fireEvent.mouseEnter(submenuTrigger());
      await waitFor(() => {
        expect(screen.getByText("Sub action")).toBeInTheDocument();
      });

      await fireEvent.mouseLeave(submenuTrigger());
      vi.advanceTimersByTime(150);
      await waitFor(() => {
        expect(screen.queryByText("Sub action")).not.toBeInTheDocument();
      });
      vi.useRealTimers();
    });
  });

  it("activates focused item with Enter when menu is open", async () => {
    const onEdit = vi.fn();
    render(() => <BasicMenu onEdit={onEdit} />);
    await fireEvent.keyDown(screen.getByRole("button", { name: "Options" }), {
      key: "ArrowDown",
    });
    await waitFor(() => {
      expect(screen.getByText("Edit")).toHaveAttribute("tabindex", "0");
    });

    await fireEvent.keyDown(screen.getByText("Edit"), { key: "Enter" });
    expect(onEdit).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    });
  });

  it("opens menu with Enter from closed trigger", async () => {
    render(() => <BasicMenu />);
    await fireEvent.keyDown(screen.getByRole("button", { name: "Options" }), {
      key: "Enter",
    });
    await waitFor(() => {
      expect(screen.getByText("Edit")).toBeInTheDocument();
    });
  });

  it("ignores clicks on disabled menu items", async () => {
    const onAction = vi.fn();
    render(() => (
      <Menu>
        <MenuTrigger>
          {(attrs) => <button {...attrs}>Options</button>}
        </MenuTrigger>
        <MenuContent>
          <MenuItem disabled onClick={onAction}>
            Disabled item
          </MenuItem>
        </MenuContent>
      </Menu>
    ));

    await fireEvent.click(screen.getByRole("button", { name: "Options" }));
    await fireEvent.click(screen.getByText("Disabled item"));
    expect(onAction).not.toHaveBeenCalled();
    expect(screen.getByText("Disabled item")).toBeInTheDocument();
  });

  it("renders menu separator", async () => {
    render(() => (
      <Menu>
        <MenuTrigger>
          {(attrs) => <button {...attrs}>Options</button>}
        </MenuTrigger>
        <MenuContent>
          <MenuItem>First</MenuItem>
          <MenuSeparator />
          <MenuItem>Second</MenuItem>
        </MenuContent>
      </Menu>
    ));

    await fireEvent.click(screen.getByRole("button", { name: "Options" }));
    expect(document.querySelector(".h-px")).toBeTruthy();
  });

  it("activates focused item with Space when menu is open", async () => {
    const onDelete = vi.fn();
    render(() => <BasicMenu onDelete={onDelete} />);
    await fireEvent.keyDown(screen.getByRole("button", { name: "Options" }), {
      key: "ArrowUp",
    });
    await waitFor(() => {
      expect(screen.getByText("Delete")).toHaveAttribute("tabindex", "0");
    });

    await fireEvent.keyDown(screen.getByText("Delete"), { key: " " });
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("activates highlighted item via Enter on trigger keydown handler", async () => {
    const onEdit = vi.fn();
    render(() => <BasicMenu onEdit={onEdit} />);
    const trigger = screen.getByRole("button", { name: "Options" });

    await fireEvent.keyDown(trigger, { key: "ArrowDown" });
    await waitFor(() => {
      expect(screen.getByText("Edit")).toHaveAttribute("tabindex", "0");
    });

    await fireEvent.keyDown(trigger, { key: "Enter" });
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it("flips horizontal position when menu would overflow viewport", async () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 300 });
    HTMLElement.prototype.getBoundingClientRect = vi.fn(
      () =>
        ({
          top: 200,
          bottom: 240,
          left: 250,
          right: 290,
          width: 40,
          height: 40,
          x: 250,
          y: 200,
          toJSON: () => ({}),
        }) as DOMRect
    );

    render(() => (
      <Menu position="bottom-start">
        <MenuTrigger>
          {(attrs) => <button {...attrs}>Edge menu</button>}
        </MenuTrigger>
        <MenuContent>
          <MenuItem>Near edge</MenuItem>
        </MenuContent>
      </Menu>
    ));

    await fireEvent.click(screen.getByRole("button", { name: "Edge menu" }));
    await waitFor(() => {
      expect(screen.getByRole("menu").className).toContain("right-0");
    });
  });

  it("opens upward when bottom-positioned menu is near the viewport bottom", async () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 800 });
    HTMLElement.prototype.getBoundingClientRect = vi.fn(
      () =>
        ({
          top: 720,
          bottom: 760,
          left: 100,
          right: 200,
          width: 100,
          height: 40,
          x: 100,
          y: 720,
          toJSON: () => ({}),
        }) as DOMRect
    );

    render(() => (
      <Menu position="bottom-start">
        <MenuTrigger>
          {(attrs) => <button {...attrs}>Low menu</button>}
        </MenuTrigger>
        <MenuContent>
          <MenuItem>Lifted item</MenuItem>
        </MenuContent>
      </Menu>
    ));

    await fireEvent.click(screen.getByRole("button", { name: "Low menu" }));
    await waitFor(() => {
      expect(screen.getByRole("menu").className).toContain("bottom-full");
    });
  });
});
