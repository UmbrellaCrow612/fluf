import fs from "fs";
import {
  test,
  expect,
  _electron as electron,
  type ElectronApplication,
  type Page,
} from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe("Electron App", () => {
  let electronApp: ElectronApplication;
  let page: Page;

  test.beforeAll(async () => {
    // Path to desktop project root (where package.json is)
    const desktopDir = path.join(__dirname, "../../../desktop");
    const mainPath = path.join(desktopDir, "dist/index.js");

    // Debug: verify paths
    console.log("Desktop dir:", desktopDir);
    console.log("Main path:", mainPath);
    console.log("Desktop exists?", fs.existsSync(desktopDir));
    console.log("Main exists?", fs.existsSync(mainPath));

    if (!fs.existsSync(mainPath)) {
      throw new Error(`Main file not found: ${mainPath}`);
    }

    electronApp = await electron.launch({
      args: [mainPath],
      cwd: desktopDir,
    });

    page = await electronApp.firstWindow();
    page.on("console", console.log);
  });

  test.afterAll(async () => {
    await electronApp?.close();
  });

  test("app launches with correct title", async () => {
    const title = await page.title();
    expect(title).toContain("Flufy");
  });
});
