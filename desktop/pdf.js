/*
 * Contains all code for serving local pdf files to render process
 */

const { pathToFileURL } = require("node:url");
const { net } = require("electron");
const fs = require("fs/promises");
const path = require("path");

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
 * @param {import("electron").Protocol} protocol
 */
const registerPdfListeners = (protocol) => {
  protocol.handle("pdf", async (request) => {
    try {
      let rawPath = request.url.replace("pdf://", "");

      if (process.platform === "win32" && /^[a-zA-Z]\/.*$/.test(rawPath)) {
        rawPath = rawPath.charAt(0) + ":" + rawPath.substring(1);
      }

      const absoluteFilePath = path.resolve(rawPath);

      try {
        await fs.access(absoluteFilePath);
      } catch {
        return new Response("File Not Found", { status: 404 });
      }

      const fileURL = pathToFileURL(absoluteFilePath).toString();

      return net.fetch(fileURL);
    } catch (/** @type {any} */ error) {
      console.error("PDF protocol error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  });
};

module.exports = {
  registerPdfProtocol,
  registerPdfListeners,
};
