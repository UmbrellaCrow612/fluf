import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  workers: 1,
  reporter: [["html", { open: "never" }]],
  use: {
    trace: "retain-on-failure",
    video: "on",
    screenshot: {
      mode: "on-first-failure",
    },
    headless: true,
  },
  webServer: {
    command: "npm run start",
    url: "http://localhost:4200/",
    reuseExistingServer: !process.env["CI"],
    timeout: 120 * 1000,
  },
});
