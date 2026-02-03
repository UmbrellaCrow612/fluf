// Defines types for the backend electron side and also then generated for the frontend side to use, on frontend side do not EDIT the generated
// type.d.ts file any changes made in type.js run npx tsc in desktop to update the UI side types they are purley generated and should only be edited via the ts cmd stated before

/**
 * A generic type that merges the parameters of two callbacks
 * and uses the return type of the second.
 * @template {(...args: any[]) => any} T - The first callback
 * @template {(...args: any[]) => any} U - The second callback
 * @typedef {(...args: [...Parameters<T>, ...Parameters<U>]) => ReturnType<U>} CombinedCallback
 */

/**
 * Typed for IpcMainInvokeEvent listener
 *
 * i.e use when you writing a listener for a channel that uses a handle
 * @callback IpcMainInvokeEventCallback
 * @param {import("electron").IpcMainInvokeEvent} event
 */

/**
 * Typed for IpcMainEvent listener
 *
 * i.e use when you writing a listener for a channel that uses a handle
 * @callback IpcMainEventCallback
 * @param {import("electron").IpcMainEvent} event
 */

/**
 * Typed for IpcRendererEvent listener
 *
 * i.e used when making a listener that runs in preload.js
 * @callback IpcRendererEventCallback
 * @param {import("electron").IpcRendererEvent} event
 */

/**
 * Contains all the fs api's using node fs and other file related utils
 * @typedef {Object} fsApi
 * @property {readFile} readFile - Calls fs read file
 * @property {writeToFile} write - Calls fs write
 * @property {createFile} createFile - Calls fs create
 * @property {fsExists} exists - Checks if a path exists
 * @property {fsRemove} remove - Remove a path
 * @property {readDir} readDir - Read directory
 * @property {createDirectory} createDirectory - Create a folder
 * @property {selectFolder} selectFolder - Use electron select folder
 * @property {onFsChange} onChange - Listen to a file or folder path change and run logic - will start watching the given path it'  not being watched then
 * register the callback to be run when it changes, also returns a unsub method, does NOT stop watching the path, but no longer run, the callback defined by removing it
 * @property {fsStopWatching} stopWatching - Stops watching a given path
 * @property {saveTo} saveTo - Save a files content to a given location
 * @property {selectFile} selectFile - Allow a user to select a file from the explorer
 * @property {fsGetNode} getNode - Used to fetch a path as a file node
 * @property {fuzzyFindDirectorys} fuzzyFindDirectorys - Pass a path and get a list of possible other directorys you can into 
 */

/**
 * Use a path to a file or folder and get it's fileNode information - used when you have a file path but it is not yet a node and you need it as a node format.
 * @callback fsGetNode
 * @param {string} path - The path to the file or folder
 * @returns {Promise<fileNode>} The path as a proper file node item
 */

/**
 * Allow a user to select a file from explorer
 * @callback selectFile
 * @returns {Promise<import("electron").OpenDialogReturnValue | null>}
 */

/**
 * Listen to a given file path
 * @callback fsWatch
 * @param {string} fileOrFolderPath - File or folder path to watch
 * @returns {void}
 */

/**
 * Save a file's content using the explorer to a given location
 * @callback saveTo
 * @param {string} content - The content of the file
 * @param {import("electron").SaveDialogOptions} [options] - Used to change how a file can be saved
 * @returns {Promise<boolean>} If it could or could not save it
 */

/**
 * Reads the contents of a file.
 * @callback readFile
 * @param {string} filePath - The path to the file to read.
 * @returns {Promise<string>} - A promise that resolves with the file’s content.
 */

/**
 * Write new content to a file
 * @callback writeToFile
 * @param {string} filePath - The path to the file
 * @param {string} content - The new content for the file
 * @returns {Promise<boolean>} If it could or could not write to the file
 */

/**
 * Create a file
 * @callback createFile
 * @param {string} destionationPath - The path to where the file should be created
 * @returns {Promise<boolean>} - True or false if it was able to be created
 */

/**
 * Check if a given path exists
 * @callback fsExists
 * @param {string} path - The file path to the file to check if it exists
 * @returns {Promise<boolean>} - True or false
 */

/**
 * Remove a file or folder
 * @callback fsRemove
 * @param {string} path - The path to remove
 * @returns {Promise<boolean>} If it could or could not
 */

/**
 * Reads a folder content not recursive
 * @callback readDir
 * @param {string} directoryPath - The path to the directory to read.
 * @returns {Promise<fileNode[]>} - List of file nodes
 */

/**
 * Pass a path like and get suggestions for other possible diurectory 
 * @callback fuzzyFindDirectorys
 * @param {string} pathLike - A abs path, relative path or partial path such as `./home` `home` `c:dev\home`.
 * @returns {Promise<string[]>} - List of possible auto complete paths
 */

/**
 * Create a folder at a given path
 * @callback createDirectory
 * @param {string} directoryPath - Path to create the directory at
 * @returns {Promise<boolean>} - True or false
 */

/**
 * Opens a folder selection dialog and returns the selected path.
 * @callback selectFolder
 * @returns {Promise<import("electron").OpenDialogReturnValue>} - A promise that resolves with the dialog result, including the selected path or a flag indicating cancellation.
 */

/**
 * Specific function you want to run when it changes
 * @callback onFsChangeCallback
 * @param {import("fs/promises").FileChangeInfo<string>} event - The watcher event
 * @returns {void}
 */

/**
 * Listen to a specific dir and run custom logic
 * @callback onFsChange
 * @param {string} path - The path to watch
 * @param {onFsChangeCallback} callback - The logic you want to run
 * @returns {voidCallback} unsub function
 */

/**
 * Stop watching a given path it it is being watched
 * @callback fsStopWatching
 * @param {string} path - The path being watched
 * @returns {void} Nothing
 */

/**
 * Represents a file or folder read from a directory
 * @typedef {object} fileNode
 * @property {string} name - The name of the file or folder
 * @property {string} path - The file path to the file or folder
 * @property {string} parentPath - The path to the parent folder contaning said file or folder
 * @property {string} parentName - The name of the folder containg this file or folder
 * @property {boolean} isDirectory - If the given node is a directory
 * @property {Array<fileNode>} children - Children of the node by default is empty
 * @property {boolean} expanded - Indicates if the node has been expanded
 * @property {fileNodeMode} mode - Indicates the mode of the editor to either create a file or folder
 * @property {string} extension - The file extension of the node, if it doesn't have one it will be empty
 * @property {number} size - The size of the node
 * @property {string} lastModified - A string of last modified date - uses `.toString`
 */

/**
 * The mode a node is in - if it is default it means it's just a file or folder - if the other two then it means
 * that the given node is going to be rendered as a editor to create said file or folder
 * @typedef {"createFile" | "createFolder" | "default"} fileNodeMode
 */

/**
 * Contains all utils related to the electron chroium window
 * @typedef {Object} chromeWindowApi
 * @property {chromeWindowIsMaximized} isMaximized - If the window if full screen
 * @property {chromeWindowMinimize} minimize - Minimize the window
 * @property {chromeWindowMaximize} maximize - Maximize the window
 * @property {chromeWindowClose} close - Closes the window
 * @property {chromeWindowRestore} restore - Restore the window
 */

/**
 * Checks if the window is maximized
 * @callback chromeWindowIsMaximized
 * @returns {Promise<boolean>} True or false
 */

/**
 * Minimizes the window
 * @callback chromeWindowMinimize
 * @returns {void} Nothing
 */

/**
 * Maximize the window
 * @callback chromeWindowMaximize
 * @returns {void} Nothing
 */

/**
 * Close the window
 * @callback chromeWindowClose
 * @returns {void} Nothing
 */

/**
 * Restores the browsers window back to beofre it was maximized
 * @callback chromeWindowRestore
 * @returns {void} Nothing
 */

/**
 * Contains all helpers todo with path
 * @typedef {Object} pathApi
 * @property {normalizePath} normalize - Calls path normalize
 * @property {relativePath} relative - Calls path relative
 * @property {pathSep} sep - Calls path sep
 * @property {pathJoin} join - Calls path join
 * @property {pathIsabsolute} isAbsolute - Calls path absolute
 */

/**
 * Calls path absolute
 * @callback pathIsabsolute
 * @param {string} path
 * @returns {Promise<boolean>}
 */

/**
 * Calls path.join
 *
 * @callback pathJoin
 * @param {...string} args - Path segments to join
 * @returns {Promise<string>} Joined path
 */

/**
 * Get the path seperator calls path.sep
 * @callback pathSep
 * @returns {Promise<string>}
 */

/**
 * Method to fix a filepath
 * @callback normalizePath
 * @param {string} path - The file path string
 * @returns {Promise<string>} The normalized path or empty string
 */

/**
 * Get the relative path
 * @callback relativePath
 * @param {string} from
 * @param {string} to
 * @returns {Promise<string>} The relative path or empty string
 */

/**
 * List of args to pass to ripgrep to search
 * @typedef {Object} ripgrepArgsOptions
 * @property {string} searchTerm - The search term to look for
 * @property {string} searchPath - The path to the directory to search
 * @property {string} [includes] - List of pattern of files  / folders to include `(e.g. "src/,*ts)`
 * @property {string} [excludes] - List of files / folders to exclude in the search `(e.g. "src/,*ts)`
 * @property {boolean} [hidden] - To pass the `--hidden` arg
 * @property {boolean} [noIgnore] - To ignore `.gitignore` files and search them as well
 * @property {boolean} [caseInsensitive] - To pass sensitivity arg
 */

/**
 * Represents a line searched and matched the term
 * @typedef {Object} ripGrepLine
 * @property {string} before - The content before the match
 * @property {string} match - The matched content
 * @property {string} after - The content after the matched term
 * @property {number} linenumber - The line number it appeared on
 */

/**
 * File content and lines matched by the search term for a given file result
 * @typedef {Object} ripGrepResult
 * @property {string} filePath - The path to the matched file
 * @property {string} fileName - The name of the file
 * @property {string} directoryName - The name of the folder it is in
 * @property {ripGrepLine[]} lines - List of lines contain the match term
 */

/**
 * Search a directory's files recursivley for a given string content match
 * @callback ripgrepSearch
 * @param {ripgrepArgsOptions} options - Options to refine search results
 * @returns {Promise<ripGrepResult[]>}
 */

/**
 * Contains all api methods to use ripgrep
 * @typedef {Object} ripgrepApi
 * @property {ripgrepSearch} search - Search file content for a specific term
 */

/**
 * Callback structure for callback
 * @callback voidCallback
 * @returns {void}
 */

/**
 * @typedef {"modified" | "deleted" | "new file" | "renamed" | "untracked" | "unknown"} gitFileStatus
 */

/**
 * @typedef {Object} gitFileEntry
 * @property {gitFileStatus} status - The status of the file (e.g., modified, deleted, untracked, etc.)
 * @property {string} file - The file path affected
 */

/**
 * @typedef {"staged" | "unstaged" | "untracked" | "ignored" | null} gitSection
 */

/**
 * @typedef {Object} gitStatusResult
 * @property {string|null} branch - The current branch name
 * @property {string|null} branchStatus - The descriptive status of the branch (ahead/behind/diverged)
 * @property {gitFileEntry[]} staged - Files staged for commit
 * @property {gitFileEntry[]} unstaged - Files modified but not staged
 * @property {gitFileEntry[]} untracked - Untracked files
 * @property {gitFileEntry[]} ignored - Ignored files (only if shown with `--ignored`)
 * @property {boolean} clean - Whether the working directory is clean
 */

/**
 * Runs git status in the current project and returns the result
 * @callback gitStatus
 * @param {string} directory - The folder to run `git status` in
 * @returns {Promise<gitStatusResult | null>} Result or null if it could not
 */

/**
 * Checks if the OS has git installed
 * @callback hasGit
 * @returns {Promise<boolean>} If the OS has git or not
 */

/**
 * Checks if the given folder has git Initialized
 * @callback isGitInitialized
 * @param {string} directory - The folder to check
 * @returns {Promise<boolean>} If it has it or not
 */

/**
 * Initialize git into a given folder
 * @callback initializeGit
 * @param {string} directory - The folder to init git in
 * @returns {Promise<boolean>} Success or failure
 */

/**
 * Object that contains all the git helper functions
 * @typedef {Object} gitApi
 * @property {hasGit} hasGit - Checks if the OS has GIT
 * @property {isGitInitialized} isGitInitialized - Checks if a folder has git tracking
 * @property {initializeGit} initializeGit - Init git inot a folder
 * @property {gitStatus} gitStatus - Run git status in a folder and get the result
 */

/**
 * Result object returned from fsearch
 * @typedef {Object} fsearchResult
 * @property {string} path - The absolute path to the file or folder
 * @property {string} name - The name of the file or folder
 */

/**
 * List of options to change the behaviour of the search
 * @typedef {Object} fsearchOptions
 * @property {string} term - The search term to look for
 * @property {string} directory - The folder to look in
 *
 * @property {boolean} [partial] - Match files whose names contain the search term
 * @property {boolean} [ignoreCase] - Perform a case-insensitive search
 * @property {boolean} [open] - Open the first matched file in the system’s default program
 * @property {number} [lines=0] - Number of lines to show in preview if type is file and number is greater than 0
 * @property {number} [limit] - Maximum number of matches to return
 * @property {number} [depth] - Maximum folder depth to search
 * @property {string[]} [ext] - List of file extensions to include
 * @property {string[]} [excludeExt] - List of file extensions to exclude
 * @property {string[]} [excludeDir] - List of directories to exclude
 * @property {number} [minSize] - Minimum file size number
 * @property {number} [maxSize] - Maximum file size number
 * @property {"B" | "KB"} [sizeType] - The type format used in size comparisons
 * @property {string} [modifiedBefore] - Include files modified before date (YYYY-MM-DD)
 * @property {string} [modifiedAfter] - Include files modified after date (YYYY-MM-DD)
 * @property {boolean} [hidden=false] - Include hidden files and folders in search
 * @property {boolean} [count=false] - Display only the count of matches (no file details)
 * @property {boolean} [regex=false] - Treat the search term as a regular expression pattern
 * @property {boolean} [debug=false] - Show all passed flag values and environment info without performing a search
 * @property {"file"|"folder"} [type] - Type of item to search for
 */

/**
 * Search for a given file or folder with options
 * @callback fsearch
 * @param {fsearchOptions} options Options to narrow search
 * @returns {Promise<fsearchResult[]>}
 */

/**
 * Contains all the fsearch methods
 * @typedef {Object} fsearchApi
 * @property {fsearch} search - Search for a file or folder
 */

/**
 * Write a image to clipboard to be pasted elsewhere
 * @callback writeImageToClipboard
 * @param {string} filePath The path to the file to copy to the clipboard
 * @returns {Promise<boolean>} If it could or not copy it, if the file does not exist then false else true if it could
 */

/**
 * Contains all clipboard related methods
 * @typedef {Object} clipboardApi
 * @property {writeImageToClipboard} writeImage - Writes a image path to the clipboard to be pasted in other places
 */

/**
 * Create a shell
 * @callback createShell
 * @param {string} directory - The directory to spawn it in
 * @returns {Promise<number>} - The PID of the shell or -1 for failure
 */

/**
 * Kill a specific shell by it's PID
 * @callback killShell
 * @param {number} pid - The unique identifier for it
 * @returns {Promise<boolean>} If it could or could not
 */

/**
 * Write content to the shell
 * @callback writeToShell
 * @param {number} pid - The specific shell to write to
 * @param {string} content - The content
 * @returns {void} Nothing
 */

/**
 * Resize a shell col and row
 * @callback resizeShell
 * @param {number} pid - The id of shell
 * @param {number} col - The new col size
 * @param {number} row - The new row
 * @returns {Promise<boolean>} Nothing
 */

/**
 * Run custom logic when a shell outputs stuff to it's stdout
 * @callback shellChangeCallback
 * @param {string} chunk - The output stream
 * @returns {void} Nothing
 */

/**
 * Listen to changes for a specific shell and get it's output stream
 * @callback onShellChange
 * @param {number} pid - The shell to listen to
 * @param {shellChangeCallback} callback - The callback to run
 * @returns {voidCallback} UnSub method
 */

/**
 * Listen to when a shell exists either by user typeing exit or other reason
 * @callback onShellExit
 * @param {number} pid - The specific shell to listen to
 * @param {voidCallback} callback - The method to run
 * @returns {voidCallback} Unsub method
 */

/**
 * Contains all the method to interact with shell's for terminals to use
 * @typedef {Object} shellApi
 * @property {createShell} create - Create a shell process
 * @property {killShell} kill - Stops a shell
 * @property {writeToShell} write - Write content to a specific shell
 * @property {resizeShell} resize - Resize
 * @property {onShellChange} onChange - Listen to changes for a specific shell and run logic
 * @property {onShellExit} onExit - Listen to a specific shell exit and run logic
 */

/**
 * List of all methods that can be in the method of a request / message / Notification
 * based on the action you want to perform read the link below and send that method
 *
 * @see https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#lifeCycleMessages
 * @see https://microsoft.github.io/language-server-protocol/specifications/lsp/3.17/specification/#textDocument_publishDiagnostics
 *
 * @typedef {"initialize" | "initialized" | "client/registerCapability" | "client/unregisterCapability"
 *          | "$/setTrac" | "$/logTrace" | "shutdown" | "exit" | "textDocument/didOpen"
 *          | "textDocument/didChange" | "textDocument/willSave" | "textDocument/willSaveWaitUntil"
 *          | "textDocument/didSave" | "textDocument/didClose" | "textDocument/declaration"
 *          | "textDocument/publishDiagnostics" | "textDocument/completion" | "textDocument/hover" | "textDocument/definition"
 * } LanguageServerProtocolMethod
 */

/**
 * Version of jsonrpc's
 * @typedef {"2.0"} LanguageServerjsonrpc
 */

/**
 * Holds the values language id can be.
 *
 * It is also a way of indicating which lsp have been impl
 * @typedef {"go" | "python" | "typescript"} languageId
 */

/**
 * Base interface for language server implementations.
 * All language servers should follow this structure.
 *
 * Lifecycle
 * @typedef {Object} ILanguageServer
 * @property {ILanguageServerStart} Start - Begin the language server
 * @property {ILanguageServerStop} Stop - Stop the language server
 * @property {ILanguageServerStopAll} StopAll - Stop all workspace lsp's
 * @property {ILanguageServerIsRunning} IsRunning - Checks if the server is running for a given workspace
 * @property {ILanguageServerGetWorkspaceFolders} GetWorkspaceFolders - Get active workspaces
 *
 * Text Synchronization (Notifications - don't expect responses)
 * @property {ILanguageServerDidOpenTextDocument} DidOpenTextDocument - Notify document opened
 * @property {ILanguageServerDidChangeTextDocument} DidChangeTextDocument - Notify document content changed
 * @property {ILanguageServerDidCloseTextDocument} DidCloseTextDocument - Notify document closed
 *
 *  Language Features (Requests - expect responses)
 * @property {ILanguageServerHover} Hover - Get hover information
 * @property {ILanguageServerCompletion} Completion - Get completion information
 * @property {ILanguageServerDefinition} Definition - Get a symbol definition locations
 */

/**
 * Get the go to definition of a symbol represented as one or many locations
 * @callback ILanguageServerDefinition
 * @param {string} workSpaceFolder - The path to the work space folder i.e the folder open in root
 * @param {string} filePath - The path to the file to get completions for
 * @param {import("vscode-languageserver-protocol").Position} position - The position of the symbol to get the definition for
 * @returns {Promise<import("vscode-languageserver-protocol").Definition | null>} The definition location / locations or null if the symbol is whitespace / not there
 */

/**
 * Get completion suggestions
 * @callback ILanguageServerCompletion
 * @param {string} workSpaceFolder - The path to the work space folder i.e the folder open in root
 * @param {string} filePath - The path to the file to get completions for
 * @param {import("vscode-languageserver-protocol").Position} position - Where to get the completion suggestions
 * @returns {Promise<import("vscode-languageserver-protocol").CompletionList | null>} The result of a completion request.
 */

/**
 * Get hover information
 * @callback ILanguageServerHover
 * @param {string} workSpaceFolder - The path to the work space folder i.e the folder open in root
 * @param {string} filePath - The path to the file to get hover information for
 * @param {import("vscode-languageserver-protocol").Position} position - Where to get the hover information
 * @returns {Promise<import("vscode-languageserver-protocol").Hover | null>} The result of a hover request or nothing if you hover over whitespace / it doesnt have hover information.
 */

/**
 * Closes a file that was opened
 * @callback ILanguageServerDidCloseTextDocument
 * @param {string} workSpaceFolder - The path to the folder
 * @param {string} filePath - The path to the file to close
 * @returns {void} Nothing
 */

/**
 * Send document changes to the LSP
 * @callback ILanguageServerDidChangeTextDocument
 * @param {string} workSpaceFolder - The path to the work space folder i.e the folder open in root
 * @param {string} filePath - The path to the file that changed
 * @param {number} version - Documents version increment after every change
 * @param {import("vscode-languageserver-protocol").TextDocumentContentChangeEvent[]} changes - List of changes made to the document
 * @returns {void} Nothing
 */

/**
 * Start the language server for a given work space, if it is already started then it ignores it for the workspace folder.
 * @callback ILanguageServerStart
 * @param {string} workspaceFolder - The path to the folder to open the LSP for
 * @returns {Promise<boolean>} If it could or could not
 */

/**
 * Stop the language server for a given work space
 * @callback ILanguageServerStop
 * @param {string} workspaceFolder
 * @returns {Promise<boolean>}
 */

/**
 * Stop all workspace lsp processes for a lsp
 * @callback ILanguageServerStopAll
 * @returns {Promise<ILanguageServerStopAllResult[]>} List of workspace folders and there stopped result
 */

/**
 * Holds workspace folder and it's stoped result
 * @typedef {Object} ILanguageServerStopAllResult
 * @property {string} workSpaceFolder - The specific workspace folder path
 * @property {boolean} result - If it was able to be stoped ot not
 */

/**
 * Check if the language server is running for a given workspace
 * @callback ILanguageServerIsRunning
 * @param {string} workSpaceFolder - The path to check
 * @returns {boolean} If it is or is not
 */

/**
 * Get all active workspace folders
 * @callback ILanguageServerGetWorkspaceFolders
 * @returns {string[]} List of workspace folder paths
 */

/**
 * Send a text document did open notification
 * @callback ILanguageServerDidOpenTextDocument
 * @param {string} workspaceFolder - The workspace folder it is for
 * @param {string} filePath - The path to file being opened for example `./file.js` etc
 * @param {languageId} languageId - Language identifier (e.g., "javascript", "python")
 * @param {number} version - Document version
 * @param {string} text - Document content
 * @returns {void} Nothing
 */

/**
 * Represents the client which sends and recives LSP messages via UI side
 * @typedef {Object} ILanguageServerClient
 *
 * @property {ILanguageServerClientStart} start - Start a specific LSP in a workspace for the given language
 * @property {ILanguageServerClientStop} stop - Stop a specific LSP for a given workspace and language
 * @property {ILanguageServerClientIsRunning} isRunning - Check if a LSP for a given workspace and language is running
 *
 * @property {ILanguageServerClientDidOpenTextDocument} didOpenTextDocument - Open a document in the LSP
 * @property {ILanguageServerClientDidChangeTextDocument} didChangeTextDocument - Sync document changes with LSP view
 * @property {ILanguageServerClientDidCloseTextDocument} didCloseTextDocument - Close the document in the LSP
 *
 * @property {ILanguageServerClientHover} hover - Get hover information
 * @property {ILanguageServerClientCompletion} completion - Get completion information at a given position
 * @property {ILanguageServerClientDefinition} definition - Get definition for a given symbol
 *
 * @property {ILanguageServerClientOnData} onData - Listen to when the LSP responds and run logic
 * @property {ILanguageServerClientOnNotifications} onNotifications - Listen to when the server responds with any notification and run logic
 * @property {ILanguageServerClientOnNotification} onNotification - Listen to when a specific notification is sent out and run logic
 * @property {ILanguageServerClientOnReady} onReady - Listen to when the server just becomes ready and run logic
 */

/**
 * Get definition for a given symbol
 * @callback ILanguageServerClientDefinition
 * @param {string} workSpaceFolder - The workspace folder path
 * @param {languageId} languageId - The language identifier
 * @param {string} filePath - The path to the file for the definition
 * @param {import("vscode-languageserver-protocol").Position} position - The position of the symbol to get the definition for
 * @returns {Promise<import("vscode-languageserver-protocol").Definition | null>} - The definition for the given symbol or null if the symbol is empty space
 */

/**
 * Get completion suggestions at a specific position
 * @callback ILanguageServerClientCompletion
 * @param {string} workSpaceFolder - The workspace folder path
 * @param {languageId} languageId - The language identifier
 * @param {string} filePath - The file path
 * @param {import("vscode-languageserver-protocol").Position} position - The position in the document
 * @returns {Promise<import("vscode-languageserver-protocol").CompletionList | null>} Completion items or list
 */

/**
 * Run logic for the first time when a server just becomes ready to recieve messages
 * @callback ILanguageServerClientOnReady
 * @param {ILanguageServerClientOnReadyCallback} callback - The callback to run when it becomes ready
 * @returns {voidCallback} Unsub method
 */

/**
 * @callback ILanguageServerClientOnReadyCallback
 * @param {languageId} languageId - The specific language
 * @param {string} workSpaceFolder - The path to folder
 * @returns {void} Nothing
 */

/**
 * Run logic when LSP responds with data
 * @callback ILanguageServerClientOnData
 * @param {LanguageServerOnDataCallback} callback
 * @returns {voidCallback} Unsub callback
 */

/**
 * Run logic when the LSP responds with a any notification
 * @callback ILanguageServerClientOnNotifications
 * @param {LanguageServerOnNotificationCallback} callback - The logic to run
 * @returns {voidCallback} Unsub callack to remove the callback passed from being triggered anymore
 */

/**
 * Listen to a specific notification method produced from the LSp and run logic
 * @callback ILanguageServerClientOnNotification
 * @param {LanguageServerProtocolMethod} method - The specific method channel to listen to
 * @param {LanguageServerOnNotificationCallback} callback - The logic to run
 * @returns {voidCallback} Unsub method
 */

/**
 * Get hover information
 * @callback ILanguageServerClientHover
 * @param {string} workSpaceFolder - The path to the work space folder i.e the folder open in root
 * @param {languageId} languageId - The language
 * @param {string} filePath - The path to the file to get hover information for
 * @param {import("vscode-languageserver-protocol").Position} position - Where to get the hover information
 * @returns {Promise<import("vscode-languageserver-protocol").Hover | null>} The result of a hover request or nothing it you hovered over whitesapce / it has no content.
 */

/**
 * Check if the LSP is running for a given workspace and language
 * @callback ILanguageServerClientIsRunning
 * @param {string} workSpaceFolder - The path to the folder
 * @param {languageId} languageId - The language
 *
 * @returns {Promise<boolean>} If it is or is not
 */

/**
 * Start a specific language server
 * @callback ILanguageServerClientStart
 * @param {string} workSpaceFolder - The folder to start the lsp in
 * @param {languageId}  languageId - The specific language lsp to start
 * @returns {Promise<boolean>} If it could or could not
 */

/**
 * Stop a language server for a given work space
 * @callback ILanguageServerClientStop
 * @param {string} workSpaceFolder - The path to the folder
 * @param {languageId}  languageId - The specific language lsp to stop
 * @returns {Promise<boolean>} If it could or could not
 */

/**
 * Sync document changes with the LSP
 * @callback ILanguageServerClientDidChangeTextDocument
 * @param {string} workSpaceFolder - The path to the folder
 * @param {languageId} languageId - The language of the file
 * @param {string} filePath - The path to the file that changed
 * @param {number} version - The documents version after being changed
 * @param {import("vscode-languageserver-protocol").TextDocumentContentChangeEvent[]} changes - List of changes made to file
 * @returns {void} Nothing
 */

/**
 * Close the document in the LSP
 * @callback ILanguageServerClientDidCloseTextDocument
 * @param {string} workSpaceFolder - The path to the folder
 * @param {languageId} languageId - The language of the file
 * @param {string} filePath - The path to the file
 * @returns {void} Nothing
 */

/**
 * Open a document
 * @callback ILanguageServerClientDidOpenTextDocument
 * @param {string} workSpaceFolder - The path to the folder
 * @param {languageId} languageId - The language of the file
 * @param {string} filePath - The path to the file for exmaple `c:/dev/file.js`
 * @param {number} version - The documents version
 * @param {string} documentText - The full file text
 * @returns {void} Nothing
 */

/**
 * Run logic when data has been parsed from a lsp - use as a general debug logger as it does not filter any message out
 * @callback LanguageServerOnDataCallback
 * @param {import("vscode-languageserver-protocol").ResponseMessage | import("vscode-languageserver-protocol").NotificationMessage} response - The LSP response
 * @returns {void}
 */

/**
 * Shape of data sent when a notification has been parsed and contains information about which language, workspace and content it is
 * @typedef {Object} LanguageServerNotificationResponse
 * @property {languageId} languageId - The specific language this is for
 * @property {string} workSpaceFolder - The specific work space this is for
 * @property {import("vscode-languageserver-protocol").NotificationMessage["params"]} params - The shape of params for the given method
 */

/**
 * The callback to run when a notification has been parsed
 * @callback LanguageServerOnNotificationCallback
 * @param {LanguageServerNotificationResponse} result - The parsed notification data
 * @returns {void} Nothing
 */

/**
 * The callback to run when a response produces a error
 * @callback LanguageServerOnError
 * @param {any} error - The error parsed
 * @returns {void}
 */

/**
 * Contains all methods and functions for file x
 * @typedef {Object} fileXApi
 * @property {fileXOpen} open - Open the file x window
 *
 */

/**
 * Open the file x window
 * @callback fileXOpen
 * @returns {Promise<boolean>} If it did or did not
 */

/**
 * Represents a Store API — a way to persist data between sessions
 * using a standard API format.
 * @typedef {Object} storeApi
 * @property {storeSet} set - Creates a new store for the given key or overrides an existing one
 * @property {storeRemove} remove - Removes a key if it exists
 * @property {storeClean} clean - Removes all keys
 * @property {storeGet} get - Gets the value for a specific key
 * @property {storeChange} onChange - Listens for changes to a specific key and runs logic
 */

/**
 * Listen for changes to a specific key and run logic
 * @callback storeChange
 * @param {string} key - The key identifier, for example `user_settings`
 * @param {storeChangeCallback} callback - The logic to run when the key changes
 * @returns {voidCallback} Unsubscribe method
 */

/**
 * The shape of the callback that runs when a specific key changes
 * @callback storeChangeCallback
 * @param {string} newContent - The updated content
 * @returns {void} Nothing
 */

/**
 * Creates a new key with content or overrides an existing one with the same key
 * @callback storeSet
 * @param {string} key - The key identifier, for example `user_settings`
 * @param {string} jsonObject - The JSON object representing the value to store,
 * stringified using `JSON.stringify`
 * @returns {Promise<void>} Nothing
 */

/**
 * Removes a key if it exists
 * @callback storeRemove
 * @param {string} key - The key identifier, for example `user_settings`
 * @returns {Promise<void>} Nothing
 */

/**
 * Removes all defined keys
 * @callback storeClean
 * @returns {Promise<void>} Nothing
 */

/**
 * Gets the value for a key
 * @callback storeGet
 * @param {string} key - The key identifier, for example `user_settings`
 * @returns {Promise<string | undefined>} The stored content as a string,
 * or `undefined` if the key was not found
 */

/**
 * APIs exposed to the renderer process for using Electron functions.
 *
 * @typedef {Object} ElectronApi
 *
 * @property {ripgrepApi} ripgrepApi - Contains all ripgrep related methods
 *
 * @property {gitApi} gitApi - Offers all the git func
 *
 * @property {fsearchApi} fsearchApi - Contains all fsearch api's
 *
 * @property {clipboardApi} clipboardApi - Contains all clipboard api
 *
 * @property {shellApi} shellApi - Contains all methods to use shells
 *
 * @property {pathApi} pathApi - Contains all path utils
 *
 * @property {fsApi} fsApi - Contains all file fs utils
 *
 * @property {chromeWindowApi} chromeWindowApi - Contains all utils for chroium window itself
 *
 * @property {ILanguageServerClient} lspClient - Contains all the UI api's to interact with LSP
 *
 * @property {fileXApi} fileXApi - Contains all the api's for file x
 *
 * @property {storeApi} storeApi - Contains all the api to save and restore data between browser sessions
 */

/**
 * Extends the global `window` object to include the Electron API.
 *
 * @typedef {Object} EWindow
 * @property {ElectronApi} electronApi - The attached Electron API.
 */

module.exports = {};
