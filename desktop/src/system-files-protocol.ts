/**
 * Used to GET local system files
 */

import { protocol } from "electron";
import path from "node:path";
import fs from "node:fs";
import { logger } from "./logger.js";

/**
 * Name of the scheme
 */
export const SYSTEM_FILE_PROTOCOL_NAME = "fluf";

/**
 * Called once on startup to register protocols
 */
export function registerSystemFileProtocol() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SYSTEM_FILE_PROTOCOL_NAME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
        allowServiceWorkers: true,
        corsEnabled: true,
      },
    },
  ]);
}

/**
 * Registers the protcol handler for the schemea
 */
export function registerSystemFileListeners() {
  protocol.handle(SYSTEM_FILE_PROTOCOL_NAME, async (request) => {
    const prefix = `${SYSTEM_FILE_PROTOCOL_NAME}://`;
    let filePath = request.url.slice(prefix.length);

    // Fix Windows path handling
    filePath = filePath.replace(/^([a-zA-Z])(?=\/)/, "$1:");
    filePath = path.normalize(filePath);

    try {
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return new Response("File not found", { status: 404 });
      }

      const stat = fs.statSync(filePath);

      // Handle range requests for video streaming
      const rangeHeader = request.headers.get("range");

      if (rangeHeader) {
        const parts = rangeHeader.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0] as any, 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = end - start + 1;

        const fileStream = fs.createReadStream(filePath, { start, end });

        return new Response(fileStream as any, {
          status: 206,
          headers: {
            "Content-Range": `bytes ${start}-${end}/${stat.size}`,
            "Accept-Ranges": "bytes",
            "Content-Length": String(chunksize),
            "Content-Type": getMimeType(filePath),
          },
        });
      }

      // Full file response
      const fileStream = fs.createReadStream(filePath);

      return new Response(fileStream as any, {
        headers: {
          "Content-Length": String(stat.size),
          "Content-Type": getMimeType(filePath),
          "Accept-Ranges": "bytes",
        },
      });
    } catch (error) {
      logger.error("Protocol handler error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  });
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".ogg": "video/ogg",
    ".ogv": "video/ogg",
    ".mov": "video/quicktime",
    ".mkv": "video/x-matroska",
    ".avi": "video/x-msvideo",
    ".m4v": "video/mp4",
  };
  return mimeTypes[ext] || "application/octet-stream";
}
