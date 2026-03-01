import * as os from "node:os";
import path from "path";

import {
  expect,
  test,
  type ElectronApplication,
  type Page,
} from "@playwright/test";
import { closeElectronApp, launchElectronApp } from "./app.js";
import fs from "node:fs/promises";
import { logger } from "./logger.js";

let app: ElectronApplication;
let mainWindow: Page;
let testPath: string; 

test.describe("Terminal tests", () => {
  test.beforeAll(async () => {
    const tempPrefix = path.join(os.tmpdir(), "terminal_test_folder-");
    testPath = await fs.mkdtemp(tempPrefix);
    logger.info("Creating temporary folder path at: ", testPath);

    app = await launchElectronApp(testPath);
    mainWindow = await app.firstWindow();
  });

  test.afterAll(async () => {
    await closeElectronApp(app);

    // Clean up temp directory recursively, ignore errors if it doesn't exist
    try {
      await fs.rm(testPath, { recursive: true, force: true });
      logger.info("Removing temporary directory path at: ", testPath);
    } catch (error) {
      logger.warn("Failed to remove temporary directory:", error);
    }
  });

  test("Terminal is created", async () => {
    // Select folder
    await mainWindow
      .getByRole("button", { name: "Open a file or folder" })
      .click();
    await mainWindow.getByRole("menuitem", { name: "Exit" }).click();
    await mainWindow
      .getByRole("button", { name: "Open a file or folder" })
      .click();
    await mainWindow.getByRole("menuitem", { name: "Open folder" }).click();

    // handle dialog set it to test path

    await mainWindow.locator("#top_bar_actions_terminal").click();
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
