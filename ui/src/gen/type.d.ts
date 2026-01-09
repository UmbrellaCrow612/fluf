/**
 * A generic type that merges the parameters of two callbacks
 * and uses the return type of the second.
 */
export type CombinedCallback<T extends (...args: any[]) => any, U extends (...args: any[]) => any> = (...args: [...Parameters<T>, ...Parameters<U>]) => ReturnType<U>;
/**
 * Typed for IpcMainInvokeEvent listener
 *
 * i.e use when you writing a listener for a channel that uses a handle
 */
export type IpcMainInvokeEventCallback = (event: import("electron").IpcMainInvokeEvent) => any;
/**
 * Typed for IpcMainEvent listener
 *
 * i.e use when you writing a listener for a channel that uses a handle
 */
export type IpcMainEventCallback = (event: import("electron").IpcMainEvent) => any;
/**
 * Typed for IpcRendererEvent listener
 *
 * i.e used when making a listener that runs in preload.js
 */
export type IpcRendererEventCallback = (event: import("electron").IpcRendererEvent) => any;
/**
 * Contains all the fs api's using node fs and other file related utils
 */
export type fsApi = {
    /**
     * - Calls fs read file
     */
    readFile: readFile;
    /**
     * - Calls fs write
     */
    write: writeToFile;
    /**
     * - Calls fs create
     */
    createFile: createFile;
    /**
     * - Checks if a path exists
     */
    exists: fsExists;
    /**
     * - Remove a path
     */
    remove: fsRemove;
    /**
     * - Read directory
     */
    readDir: readDir;
    /**
     * - Create a folder
     */
    createDirectory: createDirectory;
    /**
     * - Use electron select folder
     */
    selectFolder: selectFolder;
    /**
     * - Listen to a file or folder path change and run logic - will start watching the given path it'  not being watched then
     * register the callback to be run when it changes, also returns a unsub method, does NOT stop watching the path, but no longer run, the callback defined by removing it
     */
    onChange: onFsChange;
    /**
     * - Stops watching a given path
     */
    stopWatching: fsStopWatching;
    /**
     * - Save a files content to a given location
     */
    saveTo: saveTo;
    /**
     * - Allow a user to select a file from the explorer
     */
    selectFile: selectFile;
};
/**
 * Allow a user to select a file from explorer
 */
export type selectFile = () => Promise<import("electron").OpenDialogReturnValue | null>;
/**
 * Listen to a given file path
 */
export type fsWatch = (fileOrFolderPath: string) => void;
/**
 * Save a file's content using the explorer to a given location
 */
export type saveTo = (content: string, options?: Electron.SaveDialogOptions | undefined) => Promise<boolean>;
/**
 * Reads the contents of a file.
 */
export type readFile = (filePath: string) => Promise<string>;
/**
 * Write new content to a file
 */
export type writeToFile = (filePath: string, content: string) => Promise<boolean>;
/**
 * Create a file
 */
export type createFile = (destionationPath: string) => Promise<boolean>;
/**
 * Check if a given path exists
 */
export type fsExists = (path: string) => Promise<boolean>;
/**
 * Remove a file or folder
 */
export type fsRemove = (path: string) => Promise<boolean>;
/**
 * Reads a folder content not recursive
 */
export type readDir = (directoryPath: string) => Promise<fileNode[]>;
/**
 * Create a folder at a given path
 */
export type createDirectory = (directoryPath: string) => Promise<boolean>;
/**
 * Opens a folder selection dialog and returns the selected path.
 */
export type selectFolder = () => Promise<import("electron").OpenDialogReturnValue>;
/**
 * Specific function you want to run when it changes
 */
export type onFsChangeCallback = (event: import("fs/promises").FileChangeInfo<string>) => void;
/**
 * Listen to a specific dir and run custom logic
 */
export type onFsChange = (path: string, callback: onFsChangeCallback) => voidCallback;
/**
 * Stop watching a given path it it is being watched
 */
export type fsStopWatching = (path: string) => void;
/**
 * Represents a file or folder read from a directory
 */
export type fileNode = {
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
export type fileNodeMode = "createFile" | "createFolder" | "default";
/**
 * Contains all utils related to the electron chroium window
 */
export type chromeWindowApi = {
    /**
     * - If the window if full screen
     */
    isMaximized: chromeWindowIsMaximized;
    /**
     * - Minimize the window
     */
    minimize: chromeWindowMinimize;
    /**
     * - Maximize the window
     */
    maximize: chromeWindowMaximize;
    /**
     * - Closes the window
     */
    close: chromeWindowClose;
    /**
     * - Restore the window
     */
    restore: chromeWindowRestore;
};
/**
 * Checks if the window is maximized
 */
export type chromeWindowIsMaximized = () => Promise<boolean>;
/**
 * Minimizes the window
 */
export type chromeWindowMinimize = () => void;
/**
 * Maximize the window
 */
export type chromeWindowMaximize = () => void;
/**
 * Close the window
 */
export type chromeWindowClose = () => void;
/**
 * Restores the browsers window back to beofre it was maximized
 */
export type chromeWindowRestore = () => void;
/**
 * Contains all helpers todo with path
 */
export type pathApi = {
    /**
     * - Calls path normalize
     */
    normalize: normalizePath;
    /**
     * - Calls path relative
     */
    relative: relativePath;
    /**
     * - Calls path sep
     */
    sep: pathSep;
    /**
     * - Calls path join
     */
    join: pathJoin;
    /**
     * - Calls path absolute
     */
    isAbsolute: pathIsabsolute;
};
/**
 * Calls path absolute
 */
export type pathIsabsolute = (path: string) => Promise<boolean>;
/**
 * Calls path.join
 */
export type pathJoin = (...args: string[]) => Promise<string>;
/**
 * Get the path seperator calls path.sep
 */
export type pathSep = () => Promise<string>;
/**
 * Method to fix a filepath
 */
export type normalizePath = (path: string) => Promise<string>;
/**
 * Get the relative path
 */
export type relativePath = (from: string, to: string) => Promise<string>;
/**
 * List of args to pass to ripgrep to search
 */
export type ripgrepArgsOptions = {
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
export type ripGrepLine = {
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
export type ripGrepResult = {
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
export type ripgrepSearch = (options: ripgrepArgsOptions) => Promise<ripGrepResult[]>;
/**
 * Contains all api methods to use ripgrep
 */
export type ripgrepApi = {
    /**
     * - Search file content for a specific term
     */
    search: ripgrepSearch;
};
/**
 * Callback structure for callback
 */
export type voidCallback = () => void;
export type gitFileStatus = "modified" | "deleted" | "new file" | "renamed" | "untracked" | "unknown";
export type gitFileEntry = {
    /**
     * - The status of the file (e.g., modified, deleted, untracked, etc.)
     */
    status: gitFileStatus;
    /**
     * - The file path affected
     */
    file: string;
};
export type gitSection = "staged" | "unstaged" | "untracked" | "ignored" | null;
export type gitStatusResult = {
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
 * Runs git status in the current project and returns the result
 */
export type gitStatus = (directory: string) => Promise<gitStatusResult | null>;
/**
 * Checks if the OS has git installed
 */
export type hasGit = () => Promise<boolean>;
/**
 * Checks if the given folder has git Initialized
 */
export type isGitInitialized = (directory: string) => Promise<boolean>;
/**
 * Initialize git into a given folder
 */
export type initializeGit = (directory: string) => Promise<boolean>;
/**
 * Object that contains all the git helper functions
 */
export type gitApi = {
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
     * - Run git status in a folder and get the result
     */
    gitStatus: gitStatus;
};
/**
 * Result object returned from fsearch
 */
export type fsearchResult = {
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
export type fsearchOptions = {
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
export type fsearch = (options: fsearchOptions) => Promise<fsearchResult[]>;
/**
 * Contains all the fsearch methods
 */
export type fsearchApi = {
    /**
     * - Search for a file or folder
     */
    search: fsearch;
};
/**
 * Write a image to clipboard to be pasted elsewhere
 */
export type writeImageToClipboard = (filePath: string) => Promise<boolean>;
/**
 * Contains all clipboard related methods
 */
export type clipboardApi = {
    /**
     * - Writes a image path to the clipboard to be pasted in other places
     */
    writeImage: writeImageToClipboard;
};
/**
 * List of what the value of the event field can be
 */
export type tsServerOutputEvent = "projectLoadingStart" | "projectLoadingFinish" | "projectsUpdatedInBackground" | "syntaxDiag" | "semanticDiag" | "suggestionDiag" | "configFileDiag" | "typingsInstallerPid" | "setTypings" | "typingsInstalled" | "telemetry" | "largeFileReferenced";
/**
 * Represents a diagnostic sent from ts server output
 */
export type tsServerOutputBodyDiagnostic = {
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
 * Mapped from enum into a object to use from `typescript.d.ts => enum ScriptElementKind`
 */
export type tsServerOutputBodyScriptElementKind = {
    unknown: "";
    warning: "warning";
    keyword: "keyword";
    scriptElement: "script";
    moduleElement: "module";
    classElement: "class";
    localClassElement: "local class";
    interfaceElement: "interface";
    typeElement: "type";
    enumElement: "enum";
    enumMemberElement: "enum member";
    variableElement: "var";
    localVariableElement: "local var";
    variableUsingElement: "using";
    variableAwaitUsingElement: "await using";
    functionElement: "function";
    localFunctionElement: "local function";
    memberFunctionElement: "method";
    memberGetAccessorElement: "getter";
    memberSetAccessorElement: "setter";
    memberVariableElement: "property";
    memberAccessorVariableElement: "accessor";
    constructorImplementationElement: "constructor";
    callSignatureElement: "call";
    indexSignatureElement: "index";
    constructSignatureElement: "construct";
    parameterElement: "parameter";
    typeParameterElement: "type parameter";
    primitiveType: "primitive type";
    label: "label";
    alias: "alias";
    constElement: "const";
    letElement: "let";
    directory: "directory";
    externalModuleName: "external module name";
    jsxAttribute: "JSX attribute";
    string: "string";
    link: "link";
    linkName: "link name";
    linkText: "link text";
};
/**
 * Mapped from `typescript.d.ts -> export type CompletionEntry`
 */
export type tsServerOutputBodyCompletionEntry = {
    kind?: "" | "string" | "function" | "link" | "index" | "type" | "module" | "label" | "script" | "var" | "directory" | "method" | "class" | "getter" | "setter" | "accessor" | "warning" | "construct" | "keyword" | "local class" | "interface" | "enum" | "enum member" | "local var" | "using" | "await using" | "local function" | "property" | "constructor" | "call" | "parameter" | "type parameter" | "primitive type" | "alias" | "const" | "let" | "external module name" | "JSX attribute" | "link name" | "link text" | undefined;
    kindModifiers?: string | undefined;
    name?: string | undefined;
    sortText?: string | undefined;
    insertText?: string | undefined;
    filterText?: string | undefined;
    isSnippet?: boolean | undefined;
    replacementSpan?: import("typescript").server.protocol.TextSpan | undefined;
    hasAction?: boolean | undefined;
    source?: string | undefined;
    /**
     * - if needed type
     */
    sourceDisplay?: any;
    /**
     * - if needed type
     */
    labelDetails?: any;
    isRecommended?: boolean | undefined;
    isFromUncheckedFile?: boolean | undefined;
    isPackageJsonImport?: boolean | undefined;
    isImportStatementCompletion?: boolean | undefined;
    data?: any;
    commitCharacters?: string[] | undefined;
};
/**
 * The shape the body can be in
 */
export type tsServerOutputBody = {
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
    diagnostics?: tsServerOutputBodyDiagnostic[] | undefined;
    /**
     * - From completion info
     */
    isIncomplete?: boolean | undefined;
    /**
     * - From completion info entries
     */
    entries?: tsServerOutputBodyCompletionEntry[] | undefined;
};
/**
 * Represents a output produced by TS server output stream i.e a single parsed line from Content length all the way to next line
 * Could contains any of the below fields
 */
export type tsServerOutput = {
    /**
     * - The sequence
     */
    seq?: number | undefined;
    /**
     * - What type this message is
     */
    type?: "event" | "request" | "response" | undefined;
    /**
     * - What type of event was emitted
     */
    event?: tsServerOutputEvent | undefined;
    /**
     * - The body of the output
     */
    body?: tsServerOutputBody | undefined;
    /**
     * - Sequence number of the request message
     */
    request_seq?: number | undefined;
    /**
     * - Outcome of the request
     */
    success?: boolean | undefined;
    /**
     * - The command requested
     */
    command?: import("typescript").server.protocol.CommandTypes | undefined;
    /**
     * - Optional message
     */
    message?: string | undefined;
};
export type tsServerResponseCallback = (message: tsServerOutput) => void;
/**
 * Register a callback to run when ts server emits a message
 */
export type onTsServerResponse = (callback: tsServerResponseCallback) => voidCallback;
/**
 * Writes the file to tsserver stream to watch it and emit stuff for it in the stream
 */
export type tsServerOpenFile = (filePath: string, fileContent: string) => void;
/**
 * Writes the file to the stream as being edited
 */
export type tsServerEditFile = (args: import("typescript").server.protocol.ChangeRequestArgs) => void;
/**
 * Closes the file into the stream
 */
export type tsServerCloseFile = (filePath: string) => void;
/**
 * Used to stream the completion cmd into tsserver
 */
export type tsServerCompletion = (args: import("typescript").server.protocol.CompletionsRequestArgs) => void;
/**
 * Represents a shape of an object written to tsserver stdin stream - mainly typed from typescript.d.ts
 */
export type tsServerWritableObject = {
    /**
     * - What command to pass to TS server stdin stream
     */
    command: import("typescript").server.protocol.CommandTypes;
    /**
     * - Always "request" for writable messages
     */
    type: "request";
    /**
     * - Unique request sequence number
     */
    seq: number;
    /**
     * - Arguments passed to tsserver; shape depends on the command look through typescript.d.ts and then the cmd name and then it's interface
     */
    arguments: any;
};
/**
 * Trigger error checking
 */
export type tsServerError = (filePath: string) => void;
/**
 * The Typescript server, commands written to it using the methods write to the stream of the child processes and then emit said events when they are ready and parsed
 */
export type tsServer = {
    /**
     * - Register callback when ts server emits a event message such as writing diagnostics or other stuff.
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
     * - Close file into the stream
     */
    closeFile: tsServerCloseFile;
    /**
     * - Get completion data of the current file and offest into the stream
     */
    completion: tsServerCompletion;
    /**
     * - Trigger get error's / checking for a file
     */
    errors: tsServerError;
};
/**
 * Create a shell
 */
export type createShell = (directory: string) => Promise<number>;
/**
 * Kill a specific shell by it's PID
 */
export type killShell = (pid: number) => Promise<boolean>;
/**
 * Write content to the shell
 */
export type writeToShell = (pid: number, content: string) => void;
/**
 * Resize a shell col and row
 */
export type resizeShell = (pid: number, col: number, row: number) => Promise<boolean>;
/**
 * Run custom logic when a shell outputs stuff to it's stdout
 */
export type shellChangeCallback = (chunk: string) => void;
/**
 * Listen to changes for a specific shell and get it's output stream
 */
export type onShellChange = (pid: number, callback: shellChangeCallback) => voidCallback;
/**
 * Listen to when a shell exists either by user typeing exit or other reason
 */
export type onShellExit = (pid: number, callback: voidCallback) => voidCallback;
/**
 * Contains all the method to interact with shell's for terminals to use
 */
export type shellApi = {
    /**
     * - Create a shell process
     */
    create: createShell;
    /**
     * - Stops a shell
     */
    kill: killShell;
    /**
     * - Write content to a specific shell
     */
    write: writeToShell;
    /**
     * - Resize
     */
    resize: resizeShell;
    /**
     * - Listen to changes for a specific shell and run logic
     */
    onChange: onShellChange;
    /**
     * - Listen to a specific shell exit and run logic
     */
    onExit: onShellExit;
};
/**
 * List of all methods that can be in the method of a request or message
 * based on the action you want to perform read the link below and send that method
 */
export type LanguageServerProtocolMethod = "initialize" | "initialized" | "client/registerCapability" | "client/unregisterCapability" | "$/setTrac" | "$/logTrace" | "shutdown" | "exit" | "textDocument/didOpen" | "textDocument/didChange" | "textDocument/willSave" | "textDocument/willSaveWaitUntil" | "textDocument/didSave" | "textDocument/didClose" | "textDocument/declaration";
/**
 * Version of jsonrpc's
 */
export type LanguageServerjsonrpc = "2.0";
/**
 * List of the valid language id's you can pass
 */
export type LanguageServerLanguageId = "python";
/**
 * Contains all the code to interact with python language server
 */
export type pythonServer = {
    /**
     * - Open a file request
     */
    open: pythonServerOpen;
    /**
     * - Start the language server
     */
    start: pythonStart;
    /**
     * - Stop the language server
     */
    stop: pythonStop;
    /**
     * - Call some logic when the server becomes avaiable and is set up
     */
    onReady: pythonServerOnReady;
    /**
     * - Run logic when the server responds
     */
    onResponse: pythonServerOnResponse;
};
/**
 * Being the python language server
 */
export type pythonStart = (workSpaceFolder: string) => Promise<boolean>;
/**
 * Stops the python langaueg server
 */
export type pythonStop = () => Promise<boolean>;
/**
 * Opens file
 */
export type pythonServerOpen = (filePath: string, fileContent: string) => void;
/**
 * Call some logic when the python language server is ready
 */
export type pythonServerOnReady = (callback: voidCallback) => voidCallback;
/**
 * Represents the shape the notification response object can be listing fields it can possibley have
 */
export type JSONRpcNotification = {
    /**
     * - Version
     */
    jsonrpc: string;
    /**
     * - Method
     */
    method: LanguageServerProtocolMethod;
    /**
     * - Addtional info
     */
    params?: JSONRpcNotificationParams | undefined;
};
/**
 * Represents the shape the notification params can have
 */
export type JSONRpcNotificationParams = {
    /**
     * - The files URI in the shape of for example `file:\\pie.js` encoded
     */
    uri?: string | undefined;
    /**
     * - Version
     */
    version?: number | undefined;
    /**
     * - List of diagnostics
     */
    diagnostics: JSONRpcNotificationParamsDiagnostic[];
};
/**
 * Represents how a diagnostic could look like inside a notification param
 */
export type JSONRpcNotificationParamsDiagnostic = {
    /**
     * - Where the thing is located
     */
    range: {
        start: {
            line: number;
            character: number;
        };
        end: {
            line: number;
            character: number;
        };
    };
    /**
     * - Infomation
     */
    message: string;
    /**
     * - Severity
     */
    severity: number;
    /**
     * - Which LSP it is from
     */
    source: string;
};
/**
 * The shape of the callback that is called when a message is recieved from the python server
 */
export type pythonServerOnResponseCallback = (message: JSONRpcNotification) => void;
/**
 * Listen to when the server responds and run logic
 */
export type pythonServerOnResponse = (callback: pythonServerOnResponseCallback) => voidCallback;
/**
 * Holds all the specific language servers the backend supports
 */
export type languageServer = "js/ts" | "python";
/**
 * APIs exposed to the renderer process for using Electron functions.
 */
export type ElectronApi = {
    /**
     * - Contains all ripgrep related methods
     */
    ripgrepApi: ripgrepApi;
    /**
     * - Offers all the git func
     */
    gitApi: gitApi;
    /**
     * - Contains all fsearch api's
     */
    fsearchApi: fsearchApi;
    /**
     * - Contains all clipboard api
     */
    clipboardApi: clipboardApi;
    /**
     * - The ts / typescript language server
     */
    tsServer: tsServer;
    /**
     * - Contains all methods to use shells
     */
    shellApi: shellApi;
    /**
     * - Contains all path utils
     */
    pathApi: pathApi;
    /**
     * - Contains all file fs utils
     */
    fsApi: fsApi;
    /**
     * - Contains all utils for chroium window itself
     */
    chromeWindowApi: chromeWindowApi;
    /**
     * - Contains all the api's for the python language server
     */
    pythonServer: pythonServer;
};
/**
 * Extends the global `window` object to include the Electron API.
 */
export type EWindow = {
    /**
     * - The attached Electron API.
     */
    electronApi: ElectronApi;
};
