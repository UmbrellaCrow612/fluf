/**
 * Usesd a s centreal way to send events to ALL windows in the render
 */

const { webContents } = require("electron");

/**
 * Broadcast/send an event to all browser windows. This is necessary because if we have multiple windows,
 * a reference to a single window will only allow that window to receive the event.
 * This way, all open windows can receive it.
 *
 * @param {string} channel - The specific channel string like `shell:change`, etc.
 * @param {...any} args - Any data you want to broadcast that consumers expect.
 */
function broadcastToAll(channel, ...args) {
  const allWebContents = webContents.getAllWebContents();
  allWebContents.forEach((wc) => {
    wc.send(channel, ...args);
  });
}

module.exports = { broadcastToAll };
