/**
 * Reads the contents of a file.
 *
 * In the main world, you don't need to worry about the `event` argument — it's specific to Electron's main process.
 * Simply ignore it and provide any other arguments after it.
 */
type readFile = (event?: Electron.IpcMainInvokeEvent | undefined, filePath: string) => Promise<string>;
/**
 * Recursively reads a directory and retrieves all files and folders within it.
 */
type readDir = (event?: Electron.IpcMainInvokeEvent | undefined, directoryPath: string, options?: ReadDirOptions | undefined) => Promise<ReadDirObject>;
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
/**
 * Represents an object in a directory tree. Each object can be a file or a folder.
 * If it’s a folder, it contains all its subfolders and files in a tree structure.
 */
type ReadDirObject = {
    /**
     * - Indicates whether the object is a file (`true`) or a directory (`false`).
     */
    isFile: boolean;
    /**
     * - A list of child items if the object is a directory.
     */
    children?: ReadDirObject[] | undefined;
    /**
     * - The name of the file or folder.
     */
    name: string;
    /**
     * - The full path to the file or folder.
     */
    path: string;
};
/**
 * Options for reading a directory.
 */
type ReadDirOptions = {
    /**
     * - A list of folder names to ignore.
     */
    ignoreFolders?: string[] | undefined;
    /**
     * - A list of file names to ignore.
     */
    ignoreFiles?: string[] | undefined;
};
