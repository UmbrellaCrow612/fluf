/**
 * Reads the contents of a file.
 *
 * In the main world, you don't need to worry about the `event` argument — it's specific to Electron's main process.
 * Simply ignore it and provide any other arguments after it.
 */
type readFile = (event?: Electron.IpcMainInvokeEvent | undefined, filePath: string) => Promise<string>;
/**
 * Reads a folder content not recursive
 */
type readDir = (event?: Electron.IpcMainInvokeEvent | undefined, directoryPath: string) => Promise<Array<fileNode>>;
/**
 * Represents a file or folder read from a directory
 */
type fileNode = {
    /**
     * - The name of the file or folder
     */
    name: string;
    /**
     * - The file path to the file or folder
     */
    path: string;
    /**
     * - The path to the parent folder contaning said file or folder
     */
    parentPath: string;
    /**
     * - If the given node is a directory
     */
    isDirectory: boolean;
    /**
     * - Children of the node
     */
    children: Array<fileNode>;
    /**
     * - Indicates if the node has been expanded
     */
    expanded: boolean;
    /**
     * - Indicates the mode of the editor to either create a file or folder
     */
    mode: fileNodeMode;
};
/**
 * The mode a node is in - if it is default it means it's just a file or folder - if the other two then it means
 * that the given node is going to be rendered as a editor to create said file or folder
 */
type fileNodeMode = "createFile" | "createFolder" | "default";
/**
 * Opens a folder selection dialog and returns the selected path.
 */
type selectFolder = (event?: Electron.IpcMainInvokeEvent | undefined) => Promise<import("electron").OpenDialogReturnValue>;
/**
 * Checks if a file or folder exists
 */
type exists = (event?: Electron.IpcMainInvokeEvent | undefined, path: string) => Promise<boolean>;
/**
 * Minimizes the window
 */
type minimize = (event?: Electron.IpcMainInvokeEvent | undefined) => void;
/**
 * Maximize a window
 */
type maximize = (event?: Electron.IpcMainInvokeEvent | undefined) => void;
/**
 * Close the window
 */
type close = (event?: Electron.IpcMainInvokeEvent | undefined) => void;
/**
 * Checks if the window is maximized
 */
type isMaximized = (event?: Electron.IpcMainInvokeEvent | undefined) => Promise<boolean>;
/**
 * Restores the browsers window back to beofre it was maximized
 */
type restore = (event?: Electron.IpcMainInvokeEvent | undefined) => void;
/**
 * Normalise a path
 */
type normalize = (event?: Electron.IpcMainInvokeEvent | undefined, path: string) => Promise<string>;
/**
 * Create a file
 */
type createFile = (event?: Electron.IpcMainInvokeEvent | undefined, destionationPath: string) => Promise<boolean>;
/**
 * Check if a file exists at a given path
 */
type fileExists = (event?: Electron.IpcMainInvokeEvent | undefined, filePath: string) => Promise<boolean>;
/**
 * Check if a folder exists
 */
type directoryExists = (event?: Electron.IpcMainInvokeEvent | undefined, directoryPath: string) => Promise<boolean>;
/**
 * Create a folder at a given path
 */
type createDirectory = (event?: Electron.IpcMainInvokeEvent | undefined, directoryPath: string) => Promise<boolean>;
/**
 * Delete a file by it's path
 */
type deleteFile = (event?: Electron.IpcMainInvokeEvent | undefined, filePath: string) => Promise<boolean>;
/**
 * Delete an directory by it's path - recusive delete
 */
type deleteDirectory = (event?: Electron.IpcMainInvokeEvent | undefined, directoryPath: string) => Promise<boolean>;
/**
 * Data passed to the callback when a directory changes
 */
type directoryChangedData = {
    /**
     * - The directory being watched
     */
    dirPath: string;
    /**
     * - The type of change (rename = added/deleted)
     */
    eventType: "rename" | "change";
    /**
     * - The file that changed (may be null)
     */
    filename: string | null;
};
/**
 * The specific callback logic you want to run when a directory changes.
 */
type onDirectoryChangeCallback = (data: directoryChangedData) => void;
/**
 * Listen to a specific directory and fire off custom logic when the directory changes,
 * either when a file is added, removed, or modified.
 */
type onDirectoryChange = (directoryPath: string, callback: onDirectoryChangeCallback) => Promise<() => Promise<void>>;
/**
 * Watches a specific directory and emits change events
 */
type watchDirectory = (event?: Electron.IpcMainInvokeEvent | undefined, directoryPath: string) => Promise<boolean>;
/**
 * Unwatches a directory
 */
type unwatchDirectory = (event?: Electron.IpcMainInvokeEvent | undefined, directoryPath: string) => Promise<boolean>;
/**
 * Data passed when shell out stream changes
 */
type shellChangeData = {
    /**
     * - The chunk of new information
     */
    chunk: string;
    /**
     * - The id of the shell
     */
    id: string;
};
/**
 * Custom callback logic you want to run when a shell changes it's data
 */
type onShellChangeCallback = (data: shellChangeData) => void;
/**
 * Listen to when a shell changes it data either with output stream data or error data
 */
type onShellChange = (shellId: string, callback: onShellChangeCallback) => () => void;
/**
 * Information about a given shell
 */
type shellInformation = {
    /**
     * - The id of the shell
     */
    id: string;
    /**
     * - The shell spawned
     */
    shell: "powershell.exe" | "bash";
    /**
     * - List of previous output data chunks
     */
    history: string[];
};
type createShell = (event?: Electron.IpcMainInvokeEvent | undefined, dir: string) => Promise<shellInformation | undefined>;
/**
 * Run cmds in a specific shell
 */
type runCmdsInShell = (event?: Electron.IpcMainInvokeEvent | undefined, shellId: string, cmd: string) => Promise<boolean>;
/**
 * Sends a Ctrl+C (interrupt) signal to the shell.
 */
type stopCmdInShell = (event?: Electron.IpcMainInvokeEvent | undefined, shellId: string) => Promise<boolean>;
/**
 * Finds and kills a shell by its ID.
 */
type killShellById = (event?: Electron.IpcMainInvokeEvent | undefined, shellId: string) => Promise<boolean>;
/**
 * Check if a shell is still alive and running
 */
type isShellActive = (event?: Electron.IpcMainInvokeEvent | undefined, shellId: string) => Promise<boolean>;
/**
 * APIs exposed to the renderer process for using Electron functions.
 */
type ElectronApi = {
    /**
     * - Reads the contents of a file.
     */
    readFile: readFile;
    /**
     * - Reads the contents of a directory.
     */
    readDir: readDir;
    /**
     * - Opens a dialog and allows the user to choose a folder to select
     */
    selectFolder: selectFolder;
    /**
     * - Check if a file or folder exists
     */
    exists: exists;
    /**
     * - Minimizes the screen window
     */
    minimize: minimize;
    /**
     * - Maximize a window
     */
    maximize: maximize;
    /**
     * - Close the window
     */
    close: close;
    /**
     * - Check if the window screen is fully maximized
     */
    isMaximized: isMaximized;
    /**
     * - Restores the window back to beofre it was maximized
     */
    restore: restore;
    /**
     * - Normalize a path string
     */
    normalize: normalize;
    /**
     * - Create a file at the target path
     */
    createFile: createFile;
    /**
     * - Check if a file exists
     */
    fileExists: fileExists;
    /**
     * - Check if a folder exists
     */
    directoryExists: directoryExists;
    /**
     * - Create a directory folder at a given path
     */
    createDirectory: createDirectory;
    /**
     * - Delete a file by it's file path
     */
    deleteFile: deleteFile;
    /**
     * - Delete a folder directory by it's path is recursive
     */
    deleteDirectory: deleteDirectory;
    /**
     * - Listen to a specific directory change and run custom logic
     */
    onDirectoryChange: onDirectoryChange;
    /**
     * - Kill a specific shell by it's ID
     */
    killShellById: killShellById;
    /**
     * - Runs Ctrl+C in the shell
     */
    stopCmdInShell: stopCmdInShell;
    /**
     * - Run a specific cmd in a shell
     */
    runCmdsInShell: runCmdsInShell;
    /**
     * - Create a shell
     */
    createShell: createShell;
    /**
     * - Run logic when data in the shell stream changes either regular data or error output
     */
    onShellChange: onShellChange;
    /**
     * - Check if a shell is still alive
     */
    isShellActive: isShellActive;
};
/**
 * Extends the global `window` object to include the Electron API.
 */
type EWindow = {
    /**
     * - The attached Electron API.
     */
    electronApi: ElectronApi;
};
