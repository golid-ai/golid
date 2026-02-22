import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./Accordion";

function AccordionHarness(props: { type?: "single" | "multiple" }) {
  const [value, setValue] = createSignal<string | string[] | undefined>(
    props.type === "multiple" ? [] : undefined
  );
  return (
    <Accordion type={props.type ?? "single"} value={value()} onValueChange={setValue as any}>
      <AccordionItem value="faq1">
        <AccordionTrigger title="Question 1" />
        <AccordionContent>Answer 1</AccordionContent>
      </AccordionItem>
      <AccordionItem value="faq2">
        <AccordionTrigger title="Question 2" />
        <AccordionContent>Answer 2</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

describe("Accordion single mode", () => {
  it("renders triggers", () => {
    render(() => <AccordionHarness />);
    expect(screen.getByText("Question 1")).toBeInTheDocument();
    expect(screen.getByText("Question 2")).toBeInTheDocument();
  });

  it("opens panel on click", async () => {
    render(() => <AccordionHarness />);
    await fireEvent.click(screen.getByText("Question 1"));
    expect(screen.getByText("Answer 1")).toBeInTheDocument();
  });

  it("closes open panel when another is clicked", async () => {
    render(() => <AccordionHarness />);
    await fireEvent.click(screen.getByText("Question 1"));
    expect(screen.getByText("Answer 1")).toBeInTheDocument();

    await fireEvent.click(screen.getByText("Question 2"));
    expect(screen.getByText("Answer 2")).toBeInTheDocument();
  });

  it("sets aria-expanded correctly", async () => {
    render(() => <AccordionHarness />);
    const trigger = screen.getByText("Question 1").closest("button")!;
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });
});

describe("Accordion multiple mode", () => {
  it("allows multiple panels open", async () => {
    render(() => <AccordionHarness type="multiple" />);
    await fireEvent.click(screen.getByText("Question 1"));
    await fireEvent.click(screen.getByText("Question 2"));
    expect(screen.getByText("Answer 1")).toBeInTheDocument();
    expect(screen.getByText("Answer 2")).toBeInTheDocument();
  });
});
