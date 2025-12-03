/*
 * Contains all code for serving local pdf files to render process
 */

const { pathToFileURL } = require("node:url");
const { net } = require("electron");
const fs = require("fs/promises");

/**
 * Registers protocol called beofre app ready
 * @param {import("electron").Protocol} protocol main
 */
const registerPdfProtocol = (protocol) => {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "pdf",
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
      },
    },
  ]);
};

/**
 * Called on app ready, contains protocol hanlers which are added in app ready state
 * @param {import("electron").IpcMain} ipcMain
 * @param {import("electron").Protocol} protocol
 */
const registerPdfListeners = (ipcMain, protocol) => {
  protocol.handle("pdf", async (request) => {
    const urlObject = new URL(request.url);
    const rawPath = decodeURIComponent(urlObject.pathname.replace(/^\//, ""));

    const absoluteFilePath =
      process.platform === "win32"
        ? rawPath.replace(/\//g, "\\")
        : "/" + rawPath; 

    try {
      await fs.access(absoluteFilePath);
      return net.fetch(pathToFileURL(absoluteFilePath).toString());
    } catch (/** @type {any}*/ error) {
      if (error.code === "ENOENT") {
        return new Response("File Not Found", { status: 404 });
      }
      return new Response("Internal Server Error", { status: 500 });
    }
  });
};

module.exports = {
  registerPdfProtocol,
  registerPdfListeners,
};
