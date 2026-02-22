import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Pagination } from "./Pagination";

test("shows item range and total", () => {
  render(() => (
    <Pagination page={1} pageSize={10} totalItems={50} onPageChange={() => {}} />
  ));
  expect(screen.getByText("1-10")).toBeInTheDocument();
  expect(screen.getByText("50")).toBeInTheDocument();
});

test("shows current page and total pages", () => {
  render(() => (
    <Pagination page={2} pageSize={10} totalItems={50} onPageChange={() => {}} />
  ));
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.getByText("5")).toBeInTheDocument();
});

test("disables prev on first page", () => {
  render(() => (
    <Pagination page={1} pageSize={10} totalItems={50} onPageChange={() => {}} />
  ));
  expect(screen.getByLabelText("First page")).toBeDisabled();
  expect(screen.getByText("Prev")).toBeDisabled();
});

test("disables next on last page", () => {
  render(() => (
    <Pagination page={5} pageSize={10} totalItems={50} onPageChange={() => {}} />
  ));
  expect(screen.getByText("Next")).toBeDisabled();
  expect(screen.getByLabelText("Last page")).toBeDisabled();
});

test("calls onPageChange with next page", async () => {
  const onChange = vi.fn();
  render(() => (
    <Pagination page={2} pageSize={10} totalItems={50} onPageChange={onChange} />
  ));
  await fireEvent.click(screen.getByText("Next"));
  expect(onChange).toHaveBeenCalledWith(3);
});

test("calls onPageChange with previous page", async () => {
  const onChange = vi.fn();
  render(() => (
    <Pagination page={3} pageSize={10} totalItems={50} onPageChange={onChange} />
  ));
  await fireEvent.click(screen.getByText("Prev"));
  expect(onChange).toHaveBeenCalledWith(2);
});

test("uses custom label", () => {
  render(() => (
    <Pagination page={1} pageSize={10} totalItems={5} onPageChange={() => {}} label="users" />
  ));
  expect(screen.getByText(/users/)).toBeInTheDocument();
});
