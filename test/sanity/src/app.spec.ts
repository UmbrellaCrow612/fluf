import { test, expect } from "@playwright/test";
import { closeElectronApp, launchElectronApp, mainWindow } from "./app.js";

test.describe("Title test", () => {
  test.beforeAll(async () => {
    await launchElectronApp();
  });

  test.afterAll(async () => {
    await closeElectronApp();
  });

  test("app launches with correct title", async () => {
    const title = await mainWindow.title();
    expect(title).toContain("Flufy");
  });
});
