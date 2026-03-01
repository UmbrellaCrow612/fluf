import { expect } from "@playwright/test";
import { test } from "../fixture.js";

test.describe("Terminal tests", () => {
  test("Terminal is created", async ({ mainWindow }) => {
    // Open folder flow
    await mainWindow
      .getByRole("button", { name: "Open a file or folder" })
      .click();
    await mainWindow.getByRole("menuitem", { name: "Exit" }).click();
    await mainWindow
      .getByRole("button", { name: "Open a file or folder" })
      .click();
    await mainWindow.getByRole("menuitem", { name: "Open folder" }).click();

    // Open terminal
    await mainWindow.locator("#top_bar_actions_terminal").click();
    await mainWindow.getByRole("menuitem", { name: "New terminal" }).click();
    await expect(
      mainWindow.locator("app-terminal-tab-item").getByText("Terminal"),
    ).toBeVisible();

    // Close terminal
    await mainWindow
      .locator("#main_resize_container")
      .getByRole("button")
      .filter({ hasText: "close" })
      .click();
    await expect(
      mainWindow.getByText("No terminal active - create a"),
    ).toBeVisible();
  });

  test("A command works in the terminal", async ({ mainWindow }) => {
    // Open folder flow
    await mainWindow
      .getByRole("button", { name: "Open a file or folder" })
      .click();
    await mainWindow.getByRole("menuitem", { name: "Exit" }).click();
    await mainWindow
      .getByRole("button", { name: "Open a file or folder" })
      .click();
    await mainWindow.getByRole("menuitem", { name: "Open folder" }).click();

    // Open terminal
    await mainWindow.locator("#top_bar_actions_terminal").click();
    await mainWindow.getByRole("menuitem", { name: "New terminal" }).click();

    // Write 'touch tmpfile.txt && ls' and press Enter
    const terminalInput = mainWindow.getByRole("textbox", {
      name: "Terminal input",
    });
    await terminalInput.click();
    await terminalInput.fill("touch tmpfile.txt && ls");
    await terminalInput.press("Enter");

    // Expect 'ls' output with the tmpfile
    await expect(mainWindow.getByText("tmpfile.txt")).toBeVisible();

    // Write 'exit' and press Enter
    await terminalInput.click();
    await terminalInput.fill("exit");
    await terminalInput.press("Enter");

    // Verify terminal was destroyed
    await expect(
      mainWindow.getByText("No terminal active - create a"),
    ).toBeVisible();
  });
});
