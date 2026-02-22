import { render, screen } from "@solidjs/testing-library";
import { RegistrationStepper } from "./RegistrationStepper";

const steps = [
  { label: "Account" },
  { label: "Profile" },
  { label: "Review" },
];

test("renders all step numbers", () => {
  render(() => <RegistrationStepper steps={steps} currentStep={1} />);
  expect(screen.getByText("1")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.getByText("3")).toBeInTheDocument();
});

test("shows check mark for completed steps", () => {
  render(() => <RegistrationStepper steps={steps} currentStep={3} />);
  const checks = screen.getAllByText("check");
  expect(checks.length).toBe(2);
});

test("renders step labels", () => {
  render(() => <RegistrationStepper steps={steps} currentStep={2} />);
  expect(screen.getByText("Account")).toBeInTheDocument();
  expect(screen.getAllByText("Profile").length).toBeGreaterThan(0);
  expect(screen.getByText("Review")).toBeInTheDocument();
});
