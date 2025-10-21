/**
 * Reads the contents of a file.
 *
 * In the main world, you don't need to worry about the `event` argument — it's specific to Electron's main process.
 * Simply ignore it and provide any other arguments after it.
 *
 * @callback readFile
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron event argument (used in the main process; can be ignored in the main world).
 * @param {string} filePath - The path to the file to read.
 * @returns {Promise<string>} - A promise that resolves with the file’s content.
 */

/**
 * Reads a folder content not recursive
 *
 * @callback readDir
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron event argument (used in the main process; can be ignored in the main world).
 * @param {string} directoryPath - The path to the directory to read.
 * @returns {Promise<Array<fileNode>>} - A promise that resolves to a list of file nodes
 */

/**
 * Represents a file or folder read from a directory
 * @typedef {object} fileNode
 * @property {string} name - The name of the file or folder
 * @property {string} path - The file path to the file or folder
 * @property {string} parentPath - The path to the parent folder contaning said file or folder
 * @property {boolean} isDirectory - If the given node is a directory
 * @property {Array<fileNode>} children - Children of the node
 * @property {boolean} expanded - Indicates if the node has been expanded
 * @property {fileNodeMode} mode - Indicates the mode of the editor to either create a file or folder
 */

/**
 * The mode a node is in - if it is default it means it's just a file or folder - if the other two then it means
 * that the given node is going to be rendered as a editor to create said file or folder
 * @typedef {"createFile" | "createFolder" | "default"} fileNodeMode
 */

/**
 * Opens a folder selection dialog and returns the selected path.
 * @callback selectFolder
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @returns {Promise<import("electron").OpenDialogReturnValue>} - A promise that resolves with the dialog result, including the selected path or a flag indicating cancellation.
 */

/**
 * Checks if a file or folder exists
 * @callback exists
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {string} path - The file or folder path to check if it exists
 * @returns {Promise<boolean>} - True or false if it exists
 */

/**
 * Minimizes the window
 * @callback minimize
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @returns {void} Nothing
 */

/**
 * Maximize a window
 * @callback maximize
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @returns {void} Nothing
 */

/**
 * Close the window
 * @callback close
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @returns {void} Nothing
 */

/**
 * Checks if the window is maximized
 * @callback isMaximized
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @returns {Promise<boolean>} True or false
 */

/**
 * Restores the browsers window back to beofre it was maximized
 * @callback restore
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @returns {void} Nothing
 */

/**
 * Normalise a path
 * @callback normalize
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {string} path - The path to normalize
 * @returns {Promise<string>} - The normalised path
 */

/**
 * Create a file
 * @callback createFile
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {string} destionationPath - The path to where the file should be created
 * @returns {Promise<boolean>} - True or false if it was able to be created
 */

/**
 * Check if a file exists at a given path
 * @callback fileExists
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {string} filePath - The file path to the file to check if it exists
 * @returns {Promise<boolean>} - True or false
 */

/**
 * Check if a folder exists
 * @callback directoryExists
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {string} directoryPath - The path to the folder to check
 * @returns {Promise<boolean>} True or false
 */

/**
 * Create a folder at a given path
 * @callback createDirectory
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {string} directoryPath - Path to create the directory at
 * @returns {Promise<boolean>} - True or false
 */

/**
 * Delete a file by it's path
 * @callback deleteFile
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {string} filePath - The path to the file to delete
 * @returns {Promise<boolean>} True or false if the file was deleted
 */

/**
 * Delete an directory by it's path - recusive delete
 * @callback deleteDirectory
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {string} directoryPath - The path to the directory to delete
 * @returns {Promise<boolean>} True or false if it was deleted
 */

/**
 * Internal to desktop api - Represents a terminal where cmds can be run - ignore in main world
 * @typedef {Object} terminal
 * @property {string} id - A unique ID
 * @property {string} shell - The shell type to run it in
 * @property {string} directory - The directory folder to run the cmds in
 * @property {string[]} history - List of cmds ran in the terminal
 * @property {string[]} output - List of output
 * @property {import("child_process").ChildProcessWithoutNullStreams} process - The spawned shell process - ignore in main world
 * @property {import("electron").WebContents} webContents - Electron web
 */

/**
 * Represents information about a terminal instace
 * @typedef {Object} terminalInformation
 * @property {string} id - A unique ID
 * @property {string} shell - The shell type to run it in
 * @property {string} directory - The directory folder to run the cmds in
 * @property {string[]} history - List of cmds ran in the terminal
 * @property {string[]} output - List of chunk outputs
 */

/**
 * Create a terminal insatce and run cmds agaisnt
 * @callback createTerminal
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {string} directory - The directory to create the terminal in
 * @returns {Promise<terminalInformation | undefined>} The terminal information or undefined if it could not
 */

/**
 * Run cmds agaisnt a existing terminal
 * @callback runCmdInTerminal
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {string} terminalId - The ID of the terminal to run cmds agaisnt
 * @param {string} cmd - The string cmd to run for example `node myfile.js`
 * @returns {Promise<boolean>} - True if it could run cmds in the terminal or false
 */

/**
 * Kill a terminal processes manually
 * @callback killTerminal
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {string} terminalId - The terminal to kill
 * @returns {Promise<boolean>} True if it was killed else false
 */

/**
 * Shape of data passed to callback when data changes
 * @typedef {Object} terminalChangeData
 * @property {string } id - The id of the terminal emitting event
 * @property {string} chunk - The chunk string sent across
 */

/**
 * The logic to run when a terminal changes
 * @callback onTerminalChangeCallBack
 * @param {terminalChangeData} data
 * @return {void}
 */

/**
 * Listen to a specific terminal and when it changes it's output run custom callback function
 * @callback onTerminalChange
 * @param {string} terminalId - The id of the terminal to subscribe to
 * @param {onTerminalChangeCallBack} callback - The callback to run
 * @returns {() => void} - Method to unsub the callback
 */

/**
 * Get a specific terminals data by it's id
 * @callback getTerminalInformation
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {string} terminalId - The ID of the terminal to fetch
 * @returns {Promise<terminalInformation | undefined>} The terminal or nothing
 */

/**
 * Takes a list of terminal information and re spawns the procsses for these - used typically when the application closes and UI holds state of terminals spawend in the
 * lifetime and then re spawn those with the stored historyu and state
 * @callback restoreTerminals
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {terminalInformation[]} terminals - List of terminals to respawn
 * @returns {Promise<string[]>} List of terminals id's it was not able to restore if empty then all where resapwend
 */

/**
 * Data passed to the callback when a directory changes
 * @typedef {Object} directoryChangedData
 * @property {string} dirPath - The directory being watched
 * @property {"rename" | "change"} eventType - The type of change (rename = added/deleted)
 * @property {string|null} filename - The file that changed (may be null)
 */

/**
 * The specific callback logic you want to run when a directory changes.
 * @callback onDirectoryChangeCallback
 * @param {directoryChangedData} data - Information about the change
 * @returns {void}
 */

/**
 * Listen to a specific directory and fire off custom logic when the directory changes,
 * either when a file is added, removed, or modified.
 * @callback onDirectoryChange
 * @param {string} directoryPath - The path to the directory you want to listen to
 * @param {onDirectoryChangeCallback} callback - The logic to run when the directory changes
 * @returns {Promise<() => Promise<void>>} - A function to unsubscribe from the directory watcher is async
 */

/**
 * Watches a specific directory and emits change events
 * @callback watchDirectory
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {string} directoryPath - The path to the directory to watch
 * @returns {Promise<boolean>} True or false if it was watched
 */

/**
 * Unwatches a directory
 * @callback unwatchDirectory
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {string} directoryPath - The directory to unwatch if it has been watched
 * @returns {Promise<boolean>} True or flase if it was un watched
 */

/**
 * APIs exposed to the renderer process for using Electron functions.
 *
 * @typedef {Object} ElectronApi
 * @property {readFile} readFile - Reads the contents of a file.
 * @property {readDir} readDir - Reads the contents of a directory.
 * @property {selectFolder} selectFolder - Opens a dialog and allows the user to choose a folder to select
 * @property {exists} exists - Check if a file or folder exists
 * @property {minimize} minimize - Minimizes the screen window
 * @property {maximize} maximize - Maximize a window
 * @property {close} close - Close the window
 * @property {isMaximized} isMaximized - Check if the window screen is fully maximized
 * @property {restore} restore - Restores the window back to beofre it was maximized
 * @property {normalize} normalize - Normalize a path string
 * @property {createFile} createFile - Create a file at the target path
 * @property {fileExists} fileExists - Check if a file exists
 * @property {directoryExists} directoryExists - Check if a folder exists
 * @property {createDirectory} createDirectory - Create a directory folder at a given path
 * @property {deleteFile} deleteFile - Delete a file by it's file path
 * @property {deleteDirectory} deleteDirectory - Delete a folder directory by it's path is recursive
 * @property {createTerminal} createTerminal - Create a terminal to run cmds in
 * @property {runCmdInTerminal} runCmdsInTerminal - Run cmds in a given terminal
 * @property {killTerminal} killTerminal - Kill a terminal processes
 * @property {onTerminalChange} onTerminalChange - Listen to when a terminal changes and react , returns a unsub function for the callback
 * @property {getTerminalInformation} getTerminalInformation - Geta specific terminals information by it's ID
 * @property {restoreTerminals} restoreTerminals - Pass a list of terminals from previous state to respawn
 * @property {onDirectoryChange} onDirectoryChange - Listen to a specific directory change and run custom logic
 */

/**
 * Extends the global `window` object to include the Electron API.
 *
 * @typedef {Object} EWindow
 * @property {ElectronApi} electronApi - The attached Electron API.
 */
