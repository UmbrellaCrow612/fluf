/*
 * Contains all the code needed to have pty / shell support like vscode terminal
 */

const { spawn } = require("@homebridge/node-pty-prebuilt-multiarch");

/**
 * Contains a map of shell PID and then the proccess
 * @type {Map<string, import("@homebridge/node-pty-prebuilt-multiarch").IPty>}
 */
const shells = new Map();

/**
 * Add all event listener
 * @param {import("electron").IpcMain} ipcMain
 */
const registerShellListeners = (ipcMain) => {};

/**
 * Kills shells
 */
const cleanUpShells = () => {
  let a = Array.from(shells.values());

  a.forEach((x) => {
    x.write("exit" + "\n");
  });

  a.forEach((x) => {
    x.kill();
  });
};

module.exports = { registerShellListeners, cleanUpShells };
