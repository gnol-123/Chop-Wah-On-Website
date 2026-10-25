import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  use: { baseURL: baseURL ?? "http://localhost:3000" },
  ...(baseURL
    ? {}
    : {
        webServer: {
          command: "pnpm build && pnpm start",
          port: 3000,
          reuseExistingServer: true,
          timeout: 180_000,
        },
      }),
});
