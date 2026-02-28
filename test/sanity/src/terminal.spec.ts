/**
 * Contains test for testing basic features of the terminal
 */

import {
  expect,
  test,
  type ElectronApplication,
  type Page,
} from "@playwright/test";
import { closeElectronApp, launchElectronApp } from "./app.js";

let app: ElectronApplication;
let mainWindow: Page;

test.describe("Terminal tests", () => {
  test.beforeAll(async () => {
    app = await launchElectronApp();
    mainWindow = await app.firstWindow();
  });
  test.afterAll(async () => {
    await closeElectronApp(app);
  });

  test("Terminal is created", async () => {
    await mainWindow.locator("#top_bar_actions_Terminal").click();
    await mainWindow.getByRole("menuitem", { name: "New terminal" }).click();
    await expect(
      mainWindow.locator("app-terminal-tab-item").getByText("Terminal"),
    ).toBeVisible();
    await mainWindow
      .locator("#main_resize_container")
      .getByRole("button")
      .filter({ hasText: "close" })
      .click();
    await expect(
      mainWindow.getByText("No terminal active - create a"),
    ).toBeVisible();
  });
});
