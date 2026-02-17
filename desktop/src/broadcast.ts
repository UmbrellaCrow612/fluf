/**
 * Used as centreal way to send events to ALL windows in the render
 */

import { webContents } from "electron";
import { logger } from "./logger.js";
import type { ApplicationEvents, ArgsOf } from "./typed-ipc.js";

/**
 * Broadcast/send an event to all browser windows with full type safety.
 * This is necessary because if we have multiple windows, a reference to a
 * single window will only allow that window to receive the event.
 * This way, all open windows can receive it.
 */
export const broadcastToAll = <K extends keyof ApplicationEvents>(
  channel: K,
  ...args: ArgsOf<ApplicationEvents[K]>
): void => {
  const allWebContents = webContents.getAllWebContents();
  allWebContents.forEach((wc) => {
    if (!wc.isDestroyed()) {
      // Type assertion needed because Electron's webContents.send isn't generic
      (wc.send as (channel: string, ...args: any[]) => void)(channel, ...args);
    } else {
      logger.warn(
        `trying to send ipc message for channel ${String(channel)} but the given window is destroyed`,
      );
    }
  });
};
