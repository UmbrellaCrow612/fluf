/**
 * Method to read a file's content - in main world you dont need to worry about event arg thats just a electron main process thing you dont need to pass it
 * simpley ignore it and pass any other args after it
 * @callback readFile
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - Electron arg passed to func can be ignored in main world but will not be undefined in main process
 * @param {string} filePath - The file path to read
 * @returns {Promise<string>} - The files content
 */

/**
 * API's we expose in the render process to use the electron funcs
 * @typedef {Object} ElectronApi
 * @property {readFile} readFile - The function used to format text.
 */

/**
 * Extends window and offers the electron api
 * @typedef {Object} EWindow
 * @property {ElectronApi} electronApi - The electron api attached
 */
