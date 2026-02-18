/**
 * A generic type that merges the parameters of two callbacks
 * and uses the return type of the second.
 */
export type CombinedCallback<
  First extends (...args: any[]) => any,
  Second extends (...args: any[]) => any,
> = (
  ...args: [...Parameters<First>, ...Parameters<Second>]
) => ReturnType<Second>;
/**
 * Typed for IpcMainInvokeEvent listener
 *
 * i.e use when you writing a listener for a channel that uses a handle
 */
export type IpcMainInvokeEventCallback = (
  event: import("electron").IpcMainInvokeEvent,
) => any;
/**
 * Typed for IpcMainEvent listener
 *
 * i.e use when you writing a listener for a channel that uses a handle
 */
export type IpcMainEventCallback = (
  event: import("electron").IpcMainEvent,
) => any;
/**
 * Typed for IpcRendererEvent listener
 *
 * i.e used when making a listener that runs in preload.js
 */
export type IpcRendererEventCallback = (
  event: import("electron").IpcRendererEvent,
) => any;
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
  /**
   * - Used to fetch a path as a file node
   */
  getNode: fsGetNode;
  /**
   * - Pass a path and get a list of possible other directorys you can into
   */
  fuzzyFindDirectorys: fuzzyFindDirectorys;
  /**
   * - Count the amount of items a directory has - not recusive just the top layer of items count.
   */
  countItemsInDirectory: countItemsInDirectory;
};
/**
 * Counts the number of items in a given directory quickly
 */
export type countItemsInDirectory = (directoryPath: string) => Promise<number>;
/**
 * Use a path to a file or folder and get it's fileNode information - used when you have a file path but it is not yet a node and you need it as a node format.
 */
export type fsGetNode = (path: string) => Promise<fileNode>;
/**
 * Allow a user to select a file from explorer
 */
export type selectFile = () => Promise<
  import("electron").OpenDialogReturnValue | null
>;
/**
 * Listen to a given file path
 */
export type fsWatch = (fileOrFolderPath: string) => void;
/**
 * Save a file's content using the explorer to a given location
 */
export type saveTo = (
  content: string,
  options?: Electron.SaveDialogOptions | undefined,
) => Promise<boolean>;
/**
 * Reads the contents of a file.
 */
export type readFile = (filePath: string) => Promise<string>;
/**
 * Write new content to a file
 */
export type writeToFile = (
  filePath: string,
  content: string,
) => Promise<boolean>;
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
 * Pass a path like and get suggestions for other possible diurectory
 */
export type fuzzyFindDirectorys = (pathLike: string) => Promise<string[]>;
/**
 * Create a folder at a given path
 */
export type createDirectory = (directoryPath: string) => Promise<boolean>;
/**
 * Opens a folder selection dialog and returns the selected path.
 */
export type selectFolder = () => Promise<
  import("electron").OpenDialogReturnValue
>;
/**
 * Specific function you want to run when it changes
 */
export type onFsChangeCallback = (
  event: import("fs/promises").FileChangeInfo<string>,
) => void;
/**
 * Listen to a specific dir and run custom logic
 */
export type onFsChange = (
  path: string,
  callback: onFsChangeCallback,
) => voidCallback;
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
   * - The name of the folder containg this file or folder
   */
  parentName: string;
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
  /**
   * - The size of the node
   */
  size: number;
  /**
   * - A string of last modified date - uses `.toString`
   */
  lastModified: string;
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
  /**
   * - Get the root path of the system such as  `C:\` or `/` based on the system
   */
  getRootPath: getRootPath;
};
/**
 * Gets the root path based on the platform for windows it will return somthing like `C:\` and on others like linux
 * `/`
 */
export type getRootPath = () => Promise<string>;
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
export type pathSep = () => Promise<"\\" | "/">;
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
export type ripgrepSearch = (
  options: ripgrepArgsOptions,
) => Promise<ripGrepResult[]>;
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
export type gitFileStatus =
  | "modified"
  | "deleted"
  | "new file"
  | "renamed"
  | "untracked"
  | "unknown";
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
export type resizeShell = (pid: number, col: number, row: number) => void;
/**
 * Run custom logic when a shell outputs stuff to it's stdout
 */
export type shellChangeCallback = (pid: number, chunk: string) => void;
/**
 * Listen to changes for a specific shell and get it's output stream
 */
export type onShellChange = (
  pid: number,
  callback: shellChangeCallback,
) => voidCallback;
/**
 * Callback that runs when a shell exists
 */
export type onShellExitCallback = (pid:number) => void;
/**
 * Listen to when a shell exists either by user typeing exit or other reason
 */
export type onShellExit = (
  pid: number,
  callback: onShellExitCallback,
) => voidCallback;
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
 * List of all methods that can be in the method of a request / message / Notification
 * based on the action you want to perform read the link below and send that method
 */
export type LanguageServerProtocolMethod =
  | "initialize"
  | "initialized"
  | "client/registerCapability"
  | "client/unregisterCapability"
  | "$/setTrac"
  | "$/logTrace"
  | "shutdown"
  | "exit"
  | "textDocument/didOpen"
  | "textDocument/didChange"
  | "textDocument/willSave"
  | "textDocument/willSaveWaitUntil"
  | "textDocument/didSave"
  | "textDocument/didClose"
  | "textDocument/declaration"
  | "textDocument/publishDiagnostics"
  | "textDocument/completion"
  | "textDocument/hover"
  | "textDocument/definition";
/**
 * Version of jsonrpc's
 */
export type LanguageServerjsonrpc = "2.0";
/**
 * Holds the values language id can be.
 *
 * It is also a way of indicating which lsp have been impl
 */
export type languageId = "go" | "python" | "typescript";
/**
 * Base interface for language server implementations.
 * All language servers should follow this structure.
 *
 * Lifecycle
 */
export type ILanguageServer = {
  /**
   * - Begin the language server
   */
  Start: ILanguageServerStart;
  /**
   * - Stop the language server
   */
  Stop: ILanguageServerStop;
  /**
   * - Stop all workspace lsp's
   */
  StopAll: ILanguageServerStopAll;
  /**
   * - Checks if the server is running for a given workspace
   */
  IsRunning: ILanguageServerIsRunning;
  /**
   * - Get active workspaces
   *
   * Text Synchronization (Notifications - don't expect responses)
   */
  GetWorkspaceFolders: ILanguageServerGetWorkspaceFolders;
  /**
   * - Notify document opened
   */
  DidOpenTextDocument: ILanguageServerDidOpenTextDocument;
  /**
   * - Notify document content changed
   */
  DidChangeTextDocument: ILanguageServerDidChangeTextDocument;
  /**
   * - Notify document closed
   *
   * Language Features (Requests - expect responses)
   */
  DidCloseTextDocument: ILanguageServerDidCloseTextDocument;
  /**
   * - Get hover information
   */
  Hover: ILanguageServerHover;
  /**
   * - Get completion information
   */
  Completion: ILanguageServerCompletion;
  /**
   * - Get a symbol definition locations
   */
  Definition: ILanguageServerDefinition;
};
/**
 * Get the go to definition of a symbol represented as one or many locations
 */
export type ILanguageServerDefinition = (
  workSpaceFolder: string,
  filePath: string,
  position: import("vscode-languageserver-protocol").Position,
) => Promise<import("vscode-languageserver-protocol").Definition | null>;
/**
 * Get completion suggestions
 */
export type ILanguageServerCompletion = (
  workSpaceFolder: string,
  filePath: string,
  position: import("vscode-languageserver-protocol").Position,
) => Promise<import("vscode-languageserver-protocol").CompletionList | null>;
/**
 * Get hover information
 */
export type ILanguageServerHover = (
  workSpaceFolder: string,
  filePath: string,
  position: import("vscode-languageserver-protocol").Position,
) => Promise<import("vscode-languageserver-protocol").Hover | null>;
/**
 * Closes a file that was opened
 */
export type ILanguageServerDidCloseTextDocument = (
  workSpaceFolder: string,
  filePath: string,
) => void;
/**
 * Send document changes to the LSP
 */
export type ILanguageServerDidChangeTextDocument = (
  workSpaceFolder: string,
  filePath: string,
  version: number,
  changes: import("vscode-languageserver-protocol").TextDocumentContentChangeEvent[],
) => void;
/**
 * Start the language server for a given work space, if it is already started then it ignores it for the workspace folder.
 */
export type ILanguageServerStart = (
  workspaceFolder: string,
) => Promise<boolean>;
/**
 * Stop the language server for a given work space
 */
export type ILanguageServerStop = (workspaceFolder: string) => Promise<boolean>;
/**
 * Stop all workspace lsp processes for a lsp
 */
export type ILanguageServerStopAll = () => Promise<
  ILanguageServerStopAllResult[]
>;
/**
 * Holds workspace folder and it's stoped result
 */
export type ILanguageServerStopAllResult = {
  /**
   * - The specific workspace folder path
   */
  workSpaceFolder: string;
  /**
   * - If it was able to be stoped ot not
   */
  result: boolean;
};
/**
 * Check if the language server is running for a given workspace
 */
export type ILanguageServerIsRunning = (workSpaceFolder: string) => boolean;
/**
 * Get all active workspace folders
 */
export type ILanguageServerGetWorkspaceFolders = () => string[];
/**
 * Send a text document did open notification
 */
export type ILanguageServerDidOpenTextDocument = (
  workspaceFolder: string,
  filePath: string,
  languageId: languageId,
  version: number,
  text: string,
) => void;
/**
 * Represents the client which sends and recives LSP messages via UI side
 */
export type ILanguageServerClient = {
  /**
   * - Start a specific LSP in a workspace for the given language
   */
  start: ILanguageServerClientStart;
  /**
   * - Stop a specific LSP for a given workspace and language
   */
  stop: ILanguageServerClientStop;
  /**
   * - Check if a LSP for a given workspace and language is running
   */
  isRunning: ILanguageServerClientIsRunning;
  /**
   * - Open a document in the LSP
   */
  didOpenTextDocument: ILanguageServerClientDidOpenTextDocument;
  /**
   * - Sync document changes with LSP view
   */
  didChangeTextDocument: ILanguageServerClientDidChangeTextDocument;
  /**
   * - Close the document in the LSP
   */
  didCloseTextDocument: ILanguageServerClientDidCloseTextDocument;
  /**
   * - Get hover information
   */
  hover: ILanguageServerClientHover;
  /**
   * - Get completion information at a given position
   */
  completion: ILanguageServerClientCompletion;
  /**
   * - Get definition for a given symbol
   */
  definition: ILanguageServerClientDefinition;
  /**
   * - Listen to when the LSP responds and run logic
   */
  onData: ILanguageServerClientOnData;
  /**
   * - Listen to when the server responds with any notification and run logic
   */
  onNotifications: ILanguageServerClientOnNotifications;
  /**
   * - Listen to when a specific notification is sent out and run logic
   */
  onNotification: ILanguageServerClientOnNotification;
  /**
   * - Listen to when the server just becomes ready and run logic
   */
  onReady: ILanguageServerClientOnReady;
};
/**
 * Get definition for a given symbol
 */
export type ILanguageServerClientDefinition = (
  workSpaceFolder: string,
  languageId: languageId,
  filePath: string,
  position: import("vscode-languageserver-protocol").Position,
) => Promise<import("vscode-languageserver-protocol").Definition | null>;
/**
 * Get completion suggestions at a specific position
 */
export type ILanguageServerClientCompletion = (
  workSpaceFolder: string,
  languageId: languageId,
  filePath: string,
  position: import("vscode-languageserver-protocol").Position,
) => Promise<import("vscode-languageserver-protocol").CompletionList | null>;
/**
 * Run logic for the first time when a server just becomes ready to recieve messages
 */
export type ILanguageServerClientOnReady = (
  callback: ILanguageServerClientOnReadyCallback,
) => voidCallback;
export type ILanguageServerClientOnReadyCallback = (
  languageId: languageId,
  workSpaceFolder: string,
) => void;
/**
 * Run logic when LSP responds with data
 */
export type ILanguageServerClientOnData = (
  callback: LanguageServerOnDataCallback,
) => voidCallback;
/**
 * Run logic when the LSP responds with a any notification
 */
export type ILanguageServerClientOnNotifications = (
  callback: LanguageServerOnNotificationCallback,
) => voidCallback;
/**
 * Listen to a specific notification method produced from the LSp and run logic
 */
export type ILanguageServerClientOnNotification = (
  method: LanguageServerProtocolMethod,
  callback: LanguageServerOnNotificationCallback,
) => voidCallback;
/**
 * Get hover information
 */
export type ILanguageServerClientHover = (
  workSpaceFolder: string,
  languageId: languageId,
  filePath: string,
  position: import("vscode-languageserver-protocol").Position,
) => Promise<import("vscode-languageserver-protocol").Hover | null>;
/**
 * Check if the LSP is running for a given workspace and language
 */
export type ILanguageServerClientIsRunning = (
  workSpaceFolder: string,
  languageId: languageId,
) => Promise<boolean>;
/**
 * Start a specific language server
 */
export type ILanguageServerClientStart = (
  workSpaceFolder: string,
  languageId: languageId,
) => Promise<boolean>;
/**
 * Stop a language server for a given work space
 */
export type ILanguageServerClientStop = (
  workSpaceFolder: string,
  languageId: languageId,
) => Promise<boolean>;
/**
 * Sync document changes with the LSP
 */
export type ILanguageServerClientDidChangeTextDocument = (
  workSpaceFolder: string,
  languageId: languageId,
  filePath: string,
  version: number,
  changes: import("vscode-languageserver-protocol").TextDocumentContentChangeEvent[],
) => void;
/**
 * Close the document in the LSP
 */
export type ILanguageServerClientDidCloseTextDocument = (
  workSpaceFolder: string,
  languageId: languageId,
  filePath: string,
) => void;
/**
 * Open a document
 */
export type ILanguageServerClientDidOpenTextDocument = (
  workSpaceFolder: string,
  languageId: languageId,
  filePath: string,
  version: number,
  documentText: string,
) => void;
/**
 * Run logic when data has been parsed from a lsp - use as a general debug logger as it does not filter any message out
 */
export type LanguageServerOnDataCallback = (
  response:
    | import("vscode-languageserver-protocol").ResponseMessage
    | import("vscode-languageserver-protocol").NotificationMessage,
) => void;
/**
 * Shape of data sent when a notification has been parsed and contains information about which language, workspace and content it is
 */
export type LanguageServerNotificationResponse = {
  /**
   * - The specific language this is for
   */
  languageId: languageId;
  /**
   * - The specific work space this is for
   */
  workSpaceFolder: string;
  /**
   * - The shape of params for the given method
   */
  params: import("vscode-languageserver-protocol").NotificationMessage["params"];
};
/**
 * The callback to run when a notification has been parsed
 */
export type LanguageServerOnNotificationCallback = (
  result: LanguageServerNotificationResponse,
) => void;
/**
 * The callback to run when a response produces a error
 */
export type LanguageServerOnError = (error: any) => void;
/**
 * Contains all methods and functions for file x
 */
export type fileXApi = {
  /**
   * - Open the file x window
   */
  open: fileXOpen;
};
/**
 * Open the file x window
 */
export type fileXOpen = () => Promise<boolean>;
/**
 * Represents a Store API — a way to persist data between sessions
 * using a standard API format.
 */
export type storeApi = {
  /**
   * - Creates a new store for the given key or overrides an existing one
   */
  set: storeSet;
  /**
   * - Removes a key if it exists
   */
  remove: storeRemove;
  /**
   * - Removes all keys
   */
  clean: storeClean;
  /**
   * - Gets the value for a specific key
   */
  get: storeGet;
  /**
   * - Listens for changes to a specific key and runs logic
   */
  onChange: storeChange;
};
/**
 * Listen for changes to a specific key and run logic
 */
export type storeChange = (
  key: string,
  callback: storeChangeCallback,
) => voidCallback;
/**
 * The shape of the callback that runs when a specific key changes
 */
export type storeChangeCallback = (key: string, newContent: string) => void;
/**
 * Creates a new key with content or overrides an existing one with the same key
 */
export type storeSet = (key: string, jsonObject: string) => Promise<void>;
/**
 * Removes a key if it exists
 */
export type storeRemove = (key: string) => Promise<void>;
/**
 * Removes all defined keys
 */
export type storeClean = () => Promise<void>;
/**
 * Gets the value for a key
 */
export type storeGet = (key: string) => Promise<string | undefined>;
/**
 * Represents the comand server which recieves commands via IPC from other processes to perform actions
 */
export type commandServer = {
  /**
   * - Listen to when open file cmd is recieved
   */
  onOpenFile: onOpenFileCommand;
};
/**
 * Runs when the server recieves a command to open a file
 */
export type onOpenFileCommand = (
  callback: onOpenFileCommandCallback,
) => voidCallback;
/**
 * Callback to run when the command is given to the server
 */
export type onOpenFileCommandCallback = (
  request: import("flufy-ipc-contract").OpenFileRequest,
) => void | Promise<void>;
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
   * - Contains all the UI api's to interact with LSP
   */
  lspClient: ILanguageServerClient;
  /**
   * - Contains all the api's for file x
   */
  fileXApi: fileXApi;
  /**
   * - Contains all the api to save and restore data between browser sessions
   */
  storeApi: storeApi;
  /**
   * - Listne to events from external IPC process and run logic
   */
  commandServer: commandServer;
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
