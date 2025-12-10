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
     * - Children of the node by default is empty
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
    /**
     * - The file extension of the node, if it doesn't have one it will be empty
     */
    extension: string;
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
 * Runs git status in the current project and returns the result
 */
type gitStatus = (event?: Electron.IpcMainInvokeEvent | undefined, directory: string) => Promise<gitStatusResult | null>;
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
    /**
     * - Run git status in a folder and get the result
     */
    gitStatus: gitStatus;
};
/**
 * Result object returned from fsearch
 */
type fsearchResult = {
    /**
     * - The absolute path to the file or folder
     */
    path: string;
    /**
     * - The name of the file or folder
     */
    name: string;
};
/**
 * List of options to change the behaviour of the search
 */
type fsearchOptions = {
    /**
     * - The search term to look for
     */
    term: string;
    /**
     * - The folder to look in
     */
    directory: string;
    /**
     * - Match files whose names contain the search term
     */
    partial?: boolean | undefined;
    /**
     * - Perform a case-insensitive search
     */
    ignoreCase?: boolean | undefined;
    /**
     * - Open the first matched file in the system’s default program
     */
    open?: boolean | undefined;
    /**
     * - Number of lines to show in preview if type is file and number is greater than 0
     */
    lines?: number | undefined;
    /**
     * - Maximum number of matches to return
     */
    limit?: number | undefined;
    /**
     * - Maximum folder depth to search
     */
    depth?: number | undefined;
    /**
     * - List of file extensions to include
     */
    ext?: string[] | undefined;
    /**
     * - List of file extensions to exclude
     */
    excludeExt?: string[] | undefined;
    /**
     * - List of directories to exclude
     */
    excludeDir?: string[] | undefined;
    /**
     * - Minimum file size number
     */
    minSize?: number | undefined;
    /**
     * - Maximum file size number
     */
    maxSize?: number | undefined;
    /**
     * - The type format used in size comparisons
     */
    sizeType?: "B" | "KB" | undefined;
    /**
     * - Include files modified before date (YYYY-MM-DD)
     */
    modifiedBefore?: string | undefined;
    /**
     * - Include files modified after date (YYYY-MM-DD)
     */
    modifiedAfter?: string | undefined;
    /**
     * - Include hidden files and folders in search
     */
    hidden?: boolean | undefined;
    /**
     * - Display only the count of matches (no file details)
     */
    count?: boolean | undefined;
    /**
     * - Treat the search term as a regular expression pattern
     */
    regex?: boolean | undefined;
    /**
     * - Show all passed flag values and environment info without performing a search
     */
    debug?: boolean | undefined;
    /**
     * - Type of item to search for
     */
    type?: "file" | "folder" | undefined;
};
/**
 * Search for a given file or folder with options
 */
type fsearch = (event?: Electron.IpcMainInvokeEvent | undefined, options: fsearchOptions) => Promise<fsearchResult[]>;
/**
 * Write a image to clipboard to be pasted elsewhere
 */
type writeImageToClipboard = (event?: Electron.IpcMainInvokeEvent | undefined, filePath: string) => Promise<boolean>;
/**
 * Write new content to a file
 */
type writeToFile = (event?: Electron.IpcMainInvokeEvent | undefined, filePath: string, content: string) => Promise<boolean>;
/**
 * List of what the value of the event field can be
 */
type tsServerOutputEvent = "projectLoadingStart" | "projectLoadingFinish" | "projectsUpdatedInBackground" | "syntaxDiag" | "semanticDiag" | "suggestionDiag" | "configFileDiag" | "typingsInstallerPid" | "setTypings" | "typingsInstalled" | "telemetry" | "largeFileReferenced";
/**
 * Represents a diagnostic sent from ts server output
 */
type tsServerOutputDiagnostic = {
    /**
     * - Cords of the start
     */
    start: {
        line: number;
        offset: number;
    };
    /**
     * - Cords of the end
     */
    end: {
        line: number;
        offset: number;
    };
    /**
     * - Message
     */
    text: string;
    /**
     * - The code
     */
    code: number;
    /**
     * - What type of diagnostic it is
     */
    category: "suggestion" | "message" | "error";
    /**
     * - Another field it reports
     */
    reportsUnnecessary?: boolean | undefined;
};
/**
 * The shape the body can be in
 */
type tsServerOutputBody = {
    /**
     * - Optional could contain the PID number
     */
    pid?: number | undefined;
    /**
     * - The file path
     */
    file?: string | undefined;
    /**
     * - List of diagnostics
     */
    diagnostics?: tsServerOutputDiagnostic[] | undefined;
};
/**
 * Represents a output produced by TS server output stream i.e a single parsed line from Content length all the way to next line
 */
type tsServerOutput = {
    /**
     * - The sequence
     */
    seq: number;
    /**
     * - What type this message is
     */
    type: "request" | "response" | "event";
    /**
     * - What type of event was emitted
     */
    event: tsServerOutputEvent;
    /**
     * - The body of the output
     */
    body: tsServerOutputBody;
};
type tsServerResponseCallback = (message: tsServerOutput) => void;
/**
 * Register a callback to run when ts server emits a message
 */
type onTsServerResponse = (callback: tsServerResponseCallback) => voidCallback;
/**
 * Writes the file to tsserver stream to watch it and emit stuff for it in the stream
 */
type tsServerOpenFile = (filePath: string, fileContent: string) => Promise<void>;
/**
 * Writes the file to the stream as being edited
 */
type tsServerEditFile = (filePath: string, newContent: string) => Promise<void>;
/**
 * Save the file to the stream event
 */
type tsServerSaveFile = (filePath: string, content: string) => Promise<void>;
/**
 * Closes the file into the stream
 */
type tsServerCloseFile = (filePath: string) => Promise<void>;
/**
 * The Typescript server
 */
type tsServer = {
    /**
     * - Register callback when ts server emits a event message
     */
    onResponse: onTsServerResponse;
    /**
     * - Write file to open state within the ts server
     */
    openFile: tsServerOpenFile;
    /**
     * - Edit the file in the stream
     */
    editFile: tsServerEditFile;
    /**
     * - Save the file to the stream
     */
    saveFile: tsServerSaveFile;
    /**
     * - Close file into the stream
     */
    closeFile: tsServerCloseFile;
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
     * - Offers all the git func
     */
    gitApi: gitApi;
    /**
     * - Search for files or folders really fast
     */
    fsearch: fsearch;
    /**
     * - Write a file path to the clipboard to be pasted into other applications
     */
    writeImageToClipboard: writeImageToClipboard;
    /**
     * - Write new content for a file, it writes the new content as the new content of the whole file
     */
    writeToFile: writeToFile;
    /**
     * - The ts / typescript language server
     */
    tsServer: tsServer;
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
