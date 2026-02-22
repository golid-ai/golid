import { render, screen } from "@solidjs/testing-library";
import { Footer } from "./Footer";

test("renders full footer with nav links", () => {
  render(() => <Footer />);
  expect(screen.getByText("Home")).toBeInTheDocument();
  expect(screen.getByText("Login")).toBeInTheDocument();
  expect(screen.getByText("Sign Up")).toBeInTheDocument();
});

test("renders copyright year", () => {
  render(() => <Footer />);
  const year = new Date().getFullYear().toString();
  const footers = screen.getAllByText(new RegExp(year));
  expect(footers.length).toBeGreaterThan(0);
});

test("renders minimal footer without nav links", () => {
  render(() => <Footer minimal />);
  expect(screen.queryByText("Home")).toBeNull();
  expect(screen.queryByText("Login")).toBeNull();
});

test("minimal footer still shows copyright", () => {
  render(() => <Footer minimal />);
  expect(screen.getByText(/Golid/)).toBeInTheDocument();
});
