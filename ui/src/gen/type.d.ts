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
 * Write user input directly to ther shell input stream
 */
type writeToShell = (event?: Electron.IpcMainInvokeEvent | undefined, shellId: string, content: string) => Promise<boolean>;
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
 * Resize the backend shell col and width
 */
type resizeShell = (event?: Electron.IpcMainInvokeEvent | undefined, shellId: string, data: {
    cols: number;
    rows: number;
}) => Promise<boolean>;
/**
 * List of args to pass to ripgrep to search
 */
type ripgrepArgsOptions = {
    /**
     * - The search term to look for
     */
    searchTerm: string;
    /**
     * - The path to the directory to search
     */
    searchPath: string;
    /**
     * - List of pattern of files  / folders to include `(e.g. "src/,*ts)`
     */
    includes?: string | undefined;
    /**
     * - List of files / folders to exclude in the search `(e.g. "src/,*ts)`
     */
    excludes?: string | undefined;
    /**
     * - To pass the `--hidden` arg
     */
    hidden?: boolean | undefined;
    /**
     * - To ignore `.gitignore` files and search them as well
     */
    noIgnore?: boolean | undefined;
    /**
     * - To pass sensitivity arg
     */
    caseInsensitive?: boolean | undefined;
};
/**
 * Represents a line searched and matched the term
 */
type ripGrepLine = {
    /**
     * - The content before the match
     */
    before: string;
    /**
     * - The matched content
     */
    match: string;
    /**
     * - The content after the matched term
     */
    after: string;
    /**
     * - The line number it appeared on
     */
    linenumber: number;
};
/**
 * File content and lines matched by the search term for a given file result
 */
type ripGrepResult = {
    /**
     * - The path to the matched file
     */
    filePath: string;
    /**
     * - The name of the file
     */
    fileName: string;
    /**
     * - The name of the folder it is in
     */
    directoryName: string;
    /**
     * - List of lines contain the match term
     */
    lines: ripGrepLine[];
};
/**
 * Search a directory's files recursivley for a given string content match
 */
type ripGrep = (event?: Electron.IpcMainInvokeEvent | undefined, options: ripgrepArgsOptions) => Promise<ripGrepResult[]>;
/**
 * Options passed to fos folder search
 */
type fosOptions = {
    /**
     * - To search for folder names that contain the given term partially
     */
    partial?: boolean | undefined;
    /**
     * - Whether to ignore case (uppercase or lowercase) when matching
     */
    caseInsensitive?: boolean | undefined;
    /**
     * - List of folder names to exclude from the search
     */
    exclude?: string[] | undefined;
    /**
     * - How deep it will search in the given folder, e.g., stop at the first layer, etc.
     */
    depth?: number | undefined;
    /**
     * - Whether to include hidden folders (those starting with `.` such as `.git`)
     */
    includeHidden?: boolean | undefined;
    /**
     * - If a given match is found, stop and open the folder in the explorer
     */
    open?: boolean | undefined;
    /**
     * - If passed, will provide a simple tree view of matches and their contents
     */
    preview?: boolean | undefined;
    /**
     * - If passed, will simply print the number of matches found
     */
    countOnly?: boolean | undefined;
    /**
     * - Stop at a given limit when a specified number of matches have been found
     */
    limit?: number | undefined;
    /**
     * - Sorting criteria for output results
     */
    sort?: "name" | "size" | "modified" | undefined;
    /**
     * - If passed, will not run the logic but simply print out the arguments passed and their values
     */
    debug?: boolean | undefined;
};
/**
 * Result object for s fos search item
 */
type fosResult = {
    /**
     * - The name of the folder
     */
    name: string;
    /**
     * - The path to the folder
     */
    path: string;
};
/**
 * Search for a specific folder really fast
 */
type fos = (event?: Electron.IpcMainInvokeEvent | undefined, term: string, path: string, options: fosOptions) => Promise<fosResult[]>;
/**
 * Checks if the OS has git installed
 */
type hasGit = (event?: Electron.IpcMainInvokeEvent | undefined) => Promise<boolean>;
/**
 * Checks if the given folder has git Initialized
 */
type isGitInitialized = (event?: Electron.IpcMainInvokeEvent | undefined, directory: string) => Promise<boolean>;
/**
 * Initialize git into a given folder
 */
type initializeGit = (event?: Electron.IpcMainInvokeEvent | undefined, directory: string) => Promise<{
    success: boolean;
    error: string | null;
}>;
/**
 * Callback structure for callback
 */
type voidCallback = () => void;
type gitFileStatus = "modified" | "deleted" | "new file" | "renamed" | "untracked" | "unknown";
type gitFileEntry = {
    /**
     * - The status of the file (e.g., modified, deleted, untracked, etc.)
     */
    status: gitFileStatus;
    /**
     * - The file path affected
     */
    file: string;
};
type gitSection = "staged" | "unstaged" | "untracked" | "ignored" | null;
type gitStatusResult = {
    /**
     * - The current branch name
     */
    branch: string | null;
    /**
     * - The descriptive status of the branch (ahead/behind/diverged)
     */
    branchStatus: string | null;
    /**
     * - Files staged for commit
     */
    staged: gitFileEntry[];
    /**
     * - Files modified but not staged
     */
    unstaged: gitFileEntry[];
    /**
     * - Untracked files
     */
    untracked: gitFileEntry[];
    /**
     * - Ignored files (only if shown with `--ignored`)
     */
    ignored: gitFileEntry[];
    /**
     * - Whether the working directory is clean
     */
    clean: boolean;
};
/**
 * Callback to run when git changes
 */
type onGitChangeCallback = (data: gitStatusResult) => void;
/**
 * Listen to when git changes i.e files modified and run custom logic
 */
type onGitChange = (callback: onGitChangeCallback) => voidCallback;
/**
 * Begins watching the git reppo if there is one, can be called multiple times safeley
 */
type watchGitRepo = (event?: Electron.IpcMainInvokeEvent | undefined, directory: string) => Promise<boolean>;
/**
 * Object that contains all the git helper functions
 */
type gitApi = {
    /**
     * - Checks if the OS has GIT
     */
    hasGit: hasGit;
    /**
     * - Checks if a folder has git tracking
     */
    isGitInitialized: isGitInitialized;
    /**
     * - Init git inot a folder
     */
    initializeGit: initializeGit;
    /**
     * - Listen to changes and run custom logic
     */
    onGitChange: onGitChange;
    /**
     * - Begins watching git repo, can be called multiple times, allows the callbacks registered to begin to run
     */
    watchGitRepo: watchGitRepo;
};
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
     * - Write to a specific shells input stream
     */
    writeToShell: writeToShell;
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
    /**
     * - Resize the backend shell col and width
     */
    resizeShell: resizeShell;
    /**
     * - Search a folder files for a specific search term and get a list of matching results
     */
    ripGrep: ripGrep;
    /**
     * - Search for a specific folder.
     */
    fos: fos;
    /**
     * - Offers all the git func
     */
    gitApi: gitApi;
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
