import { test, expect } from "@playwright/test";

/**
 * Auth smoke tests — requires dev_seed.sql applied and full stack running.
 *
 * IMPORTANT: The login page displays "Welcome back" — never use /welcome/i
 * to verify login succeeded. Use "Dashboard" (the h1 on the dashboard page).
 *
 * Run manually:
 *   docker compose up -d
 *   cd frontend && npx playwright test
 */

test.describe("Login -> Dashboard -> Logout", () => {
  test("full auth loop with seeded user", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[type="email"]', "user@example.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');

    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15000 });

    const navLogout = page.getByRole("button", { name: /logout/i });
    if (await navLogout.isVisible()) {
      await navLogout.click();
    } else {
      await page.goto("/");
    }

    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible({ timeout: 5000 });
  });

  test("invalid credentials stay on login", async ({ page }) => {
    await page.goto("/login");

    await page.fill('input[type="email"]', "wrong@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/login");
  });
});

test.describe("Public Pages", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Golid" })).toBeVisible();
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
  });

  test("login page has form and links", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
  });

  test("signup page has registration form", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.locator('[placeholder="you@example.com"]')).toBeVisible();
    await expect(page.locator('[placeholder="Create a password"]')).toBeVisible();
  });
});

test.describe("Protected Routes", () => {
  test("dashboard redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  });

  test("settings redirects to login when unauthenticated", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  });
});
