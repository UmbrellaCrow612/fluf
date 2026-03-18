/**
 * Used to get local system files
 */

import { net, protocol } from "electron";
import path from "node:path";
import url from "node:url";

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
      },
    },
  ]);
}

/**
 * Registers the protcol handler for the schemea
 */
export function registerSystemFileListeners() {
  protocol.handle(SYSTEM_FILE_PROTOCOL_NAME, (request) => {
    const prefix = `${SYSTEM_FILE_PROTOCOL_NAME}://`;
    let filePath = request.url.slice(prefix.length);
    filePath = filePath.replace(/^([a-zA-Z])(?=\/)/, '$1:');
    filePath = filePath.replace(/^\/([a-zA-Z]:)/, '$1');
    
    return net.fetch(url.pathToFileURL(path.normalize(filePath)).toString());
  });
}
