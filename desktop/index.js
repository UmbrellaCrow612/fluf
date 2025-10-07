const { app, BrowserWindow } = require("electron");
const { loadEnv } = require("./libs/env");

loadEnv();

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    minWidth: 800,
    height: 600,
    minHeight: 600,
  });

  if (process.env.MODE === "dev") {
    // In dev we can just load the running react app on the website port it is running on instead of loading it from file system works the same
    console.log(
      "Running dev mode loading website from " + process.env.DEV_UI_PORT + "\n"
    );

    win.loadURL(process.env.DEV_UI_PORT);
  } else {
    win.loadFile("index.html"); // fix this later to point to dist folder
  }
};

app.whenReady().then(() => {
  createWindow();
});
