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
 * Internal to desktop api - Represents a terminal where cmds can be run - ignore process in main world
 */
type terminal = {
    /**
     * - A unique ID
     */
    id: string;
    /**
     * - The shell type to run it in
     */
    shell: string;
    /**
     * - The directory folder to run the cmds in
     */
    directory: string;
    /**
     * - List of cmds ran in the terminal
     */
    history: string[];
    /**
     * - The output string in the terminal
     */
    output: string;
    /**
     * - The spawned shell process - ignore in main world
     */
    process: import("child_process").ChildProcessWithoutNullStreams;
    /**
     * - Electron web
     */
    webContents: import("electron").WebContents;
};
/**
 * Represents information about a terminal instace
 */
type terminalInformation = {
    /**
     * - A unique ID
     */
    id: string;
    /**
     * - The shell type to run it in
     */
    shell: string;
    /**
     * - The directory folder to run the cmds in
     */
    directory: string;
    /**
     * - List of cmds ran in the terminal
     */
    history: string[];
    /**
     * - The output string in the terminal
     */
    output: string;
};
/**
 * Create a terminal insatce and run cmds agaisnt
 */
type createTerminal = (event?: Electron.IpcMainInvokeEvent | undefined, directory: string) => Promise<terminalInformation | undefined>;
/**
 * Run cmds agaisnt a existing terminal
 */
type runCmdInTerminal = (event?: Electron.IpcMainInvokeEvent | undefined, terminalId: string, cmd: string) => Promise<boolean>;
/**
 * Kill a terminal processes manually
 */
type killTerminal = (event?: Electron.IpcMainInvokeEvent | undefined, terminalId: string) => any;
/**
 * Subscribes to data events from any terminal.
 */
type onTerminalData = (callback: (arg0: {
    id: string;
    output: string;
}) => any) => Function;
/**
 * Subscribes to exit events from any terminal.
 */
type onTerminalExit = (callback: (arg0: {
    id: string;
}) => any) => Function;
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
     * - Create a terminal to run cmds in
     */
    createTerminal: createTerminal;
    /**
     * - Run cmds in a given terminal
     */
    runCmdsInTerminal: runCmdInTerminal;
    /**
     * - Kill a terminal processes
     */
    killTerminal: killTerminal;
    /**
     * - Sub to terminal data changes
     */
    onTerminalData: onTerminalData;
    /**
     * - Sub to exit of a terminal
     */
    onTerminalExit: onTerminalExit;
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
