/**
 * Used as a way of sotring generic JSON objects in keys and also modifying them, this is used for stoaring things between browser windows.
 */

const { logger } = require("./logger");

const registerStoreLi = (ipcMain) => {};


// function broadcast(channel, payload) {
//   BrowserWindow.getAllWindows().forEach(win => {
//     win.webContents.send(channel, payload);
//   });
// }

module.exports = { registerStoreLi };
