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
