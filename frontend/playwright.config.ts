import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",
  
  // Serial execution — auth rate limiting (5 req/min) makes parallel unsafe
  fullyParallel: false,
  workers: 1,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Per-test timeout (prevents tests from hanging forever)
  timeout: 30_000,
  
  // Kill entire suite after 5 minutes in CI
  globalTimeout: process.env.CI ? 5 * 60_000 : undefined,
  
  // Reporter to use — list for real-time progress in CI
  reporter: process.env.CI ? [["list"], ["github"]] : "html",
  
  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.E2E_BASE_URL || "http://localhost:3000",
    
    // Collect trace when retrying the failed test
    trace: "on-first-retry",
    
    // Take screenshot on failure
    screenshot: "only-on-failure",
    
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Uncomment for cross-browser testing:
    // {
    //   name: "firefox",
    //   use: { ...devices["Desktop Firefox"] },
    // },
    // {
    //   name: "webkit",
    //   use: { ...devices["Desktop Safari"] },
    // },
  ],

  // Start the frontend dev server before running tests.
  // In CI, Docker Compose provides backend + db. Playwright starts the frontend.
  // Locally, reuses an already-running dev server if available.
  webServer: {
    command: process.env.CI
      ? "node --require ./tests/e2e/keep-alive.cjs node_modules/.bin/vinxi dev --port 3000"
      : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
