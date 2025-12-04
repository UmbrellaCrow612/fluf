/*
 * Contains code to  interact with image files
 */

const path = require("path");
const fs = require("fs/promises");

/**
 * Register image protocol called beofre app ready
 * @param {import("electron").Protocol} protocol
 */
function registerImageProtocol(protocol) {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "image",
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
      },
    },
  ]);
}

/**
 * Register all ipcmain image listeners and custom protocols for image related actions
 * @param {import("electron").IpcMain} ipcMain
 * @param {import("electron").Protocol} protocol
 */
function registerImageListeners(ipcMain, protocol) {
  protocol.handle("image", async (request) => {
   try {
      let rawPath = request.url.replace("image://", "");

      if (process.platform === "win32" && /^[a-zA-Z]\//.test(rawPath)) {
        rawPath = rawPath.charAt(0) + ":" + rawPath.substring(1);
      }

      const absolutePath = path.resolve(rawPath);

      const validExts = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"];
      const ext = path.extname(absolutePath).toLowerCase();
      
      if (!validExts.includes(ext)) {
        return new Response("Invalid image format", { status: 400 });
      }

      try {
        await fs.access(absolutePath);
      } catch {
        return new Response("File not found", { status: 404 });
      }

      const fileBuffer = await fs.readFile(absolutePath); 
      const mimeType = getMimeType(ext);

      return new Response(fileBuffer, {
        status: 200,
        headers: { "Content-Type": mimeType },
      });
    } catch (error) {
      console.error("Image protocol error:", error);
      return new Response("Internal error", { status: 500 });
    }
  });
}

/**
 * @param {string} ext
 * @returns {string}
 */
function getMimeType(ext) {
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".bmp":
      return "image/bmp";
    case ".webp":
      return "image/webp";
    default:
      return "application/octet-stream";
  }
}
module.exports = { registerImageProtocol, registerImageListeners };
