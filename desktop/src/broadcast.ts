/**
 * Usesd a s centreal way to send events to ALL windows in the render
 */

import { webContents } from "electron";
import { logger } from "./logger.js";

/**
 * Broadcast/send an event to all browser windows. This is necessary because if we have multiple windows,
 * a reference to a single window will only allow that window to receive the event.
 * This way, all open windows can receive it.
 *
 * @param {string} channel - The specific channel string like `shell:change`, etc.
 * @param {...unknown} args - Any data you want to broadcast that consumers expect.
 */
export const broadcastToAll = (channel: string, ...args: unknown[]) => {
  const allWebContents = webContents.getAllWebContents();
  allWebContents.forEach((wc) => {
    if (!wc.isDestroyed()) {
      wc.send(channel, ...args);
    } else {
      logger.warn(
        `trying to send ipc message for channel ${channel} but the given window is destroyed`,
      );
    }
  });
};
