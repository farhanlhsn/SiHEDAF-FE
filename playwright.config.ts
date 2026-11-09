import { defineConfig, devices } from "@playwright/test";

const frontendPort = 3100;
const backendPort = 4010;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${frontendPort}`,
    // Uses the installed Chrome so no browser download is needed.
    channel: "chrome",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
    {
      name: "mobile",
      use: {
        ...devices["Pixel 7"],
        channel: "chrome",
      },
    },
  ],
  webServer: [
    {
      command: "node e2e/mock-backend.mjs",
      env: { MOCK_BACKEND_PORT: String(backendPort) },
      url: `http://localhost:${backendPort}/api/v1/__mode`,
      reuseExistingServer: true,
    },
    {
      command: `npm run build && npm run start -- -p ${frontendPort}`,
      env: { SIHEDAF_API_BASE_URL: `http://localhost:${backendPort}/api` },
      url: `http://localhost:${frontendPort}`,
      reuseExistingServer: true,
      timeout: 240_000,
    },
  ],
});
