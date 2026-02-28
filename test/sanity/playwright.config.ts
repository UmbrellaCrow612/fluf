import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./src",
  fullyParallel: true,
  forbidOnly: !!process.env["CI"],
  retries: process.env["CI"] ? 2 : 0,
  workers: process.env["CI"] ? 1 : (undefined as unknown as number),
  reporter: [['html', { open: 'never' }]], 
  use: {
    trace: "on-first-retry",
    video: {
      mode: "on-first-retry",
      size: { width: 640, height: 480 },
    },
    
  },
});
