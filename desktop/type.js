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
 * @returns {Promise<boolean>} If it could or could not
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
 * @property {boolean} isDirectory - If the given node is a directory
 * @property {Array<fileNode>} children - Children of the node by default is empty
 * @property {boolean} expanded - Indicates if the node has been expanded
 * @property {fileNodeMode} mode - Indicates the mode of the editor to either create a file or folder
 * @property {string} extension - The file extension of the node, if it doesn't have one it will be empty
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
 * Exposes node url utils
 * @typedef {Object} urlApi
 * @property {fileUriToAbsolutePath} fileUriToAbsolutePath - Convert a file uri to a file path abs
 */

/**
 * Converts a `file:///c:/dev` to a abs path like `c:\dev\some`
 * @callback fileUriToAbsolutePath
 * @param {string} fileUri
 * @returns {Promise<string>} The resolved abs path
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
 * List of what the value of the event field can be
 * @typedef {"projectLoadingStart" | "projectLoadingFinish" |
 * "projectsUpdatedInBackground" | "syntaxDiag" | "semanticDiag" | "suggestionDiag" |
 * "configFileDiag" | "typingsInstallerPid" | "setTypings" | "typingsInstalled" |"telemetry"
 * | "largeFileReferenced"} tsServerOutputEvent
 */

/**
 * Represents a diagnostic sent from ts server output
 * @typedef {Object} tsServerOutputBodyDiagnostic
 * @property {{line:number, offset: number}} start - Cords of the start
 * @property {{line:number, offset: number}} end - Cords of the end
 * @property {string} text - Message
 * @property {number} code - The code
 * @property {"suggestion" | "message" | "error"} category - What type of diagnostic it is
 * @property {boolean} [reportsUnnecessary] - Another field it reports
 */

/**
 * Mapped from enum into a object to use from `typescript.d.ts => enum ScriptElementKind`
 * @typedef {Object} tsServerOutputBodyScriptElementKind
 * @property {""} unknown
 * @property {"warning"} warning
 * @property {"keyword"} keyword
 * @property {"script"} scriptElement
 * @property {"module"} moduleElement
 * @property {"class"} classElement
 * @property {"local class"} localClassElement
 * @property {"interface"} interfaceElement
 * @property {"type"} typeElement
 * @property {"enum"} enumElement
 * @property {"enum member"} enumMemberElement
 * @property {"var"} variableElement
 * @property {"local var"} localVariableElement
 * @property {"using"} variableUsingElement
 * @property {"await using"} variableAwaitUsingElement
 * @property {"function"} functionElement
 * @property {"local function"} localFunctionElement
 * @property {"method"} memberFunctionElement
 * @property {"getter"} memberGetAccessorElement
 * @property {"setter"} memberSetAccessorElement
 * @property {"property"} memberVariableElement
 * @property {"accessor"} memberAccessorVariableElement
 * @property {"constructor"} constructorImplementationElement
 * @property {"call"} callSignatureElement
 * @property {"index"} indexSignatureElement
 * @property {"construct"} constructSignatureElement
 * @property {"parameter"} parameterElement
 * @property {"type parameter"} typeParameterElement
 * @property {"primitive type"} primitiveType
 * @property {"label"} label
 * @property {"alias"} alias
 * @property {"const"} constElement
 * @property {"let"} letElement
 * @property {"directory"} directory
 * @property {"external module name"} externalModuleName
 * @property {"JSX attribute"} jsxAttribute
 * @property {"string"} string
 * @property {"link"} link
 * @property {"link name"} linkName
 * @property {"link text"} linkText
 */

/**
 * Mapped from `typescript.d.ts -> export type CompletionEntry`
 * @typedef {Object} tsServerOutputBodyCompletionEntry
 * @property {tsServerOutputBodyScriptElementKind[keyof tsServerOutputBodyScriptElementKind]} [kind]
 * @property {string} [kindModifiers]
 * @property {string} [name]
 * @property {string} [sortText]
 * @property {string} [insertText]
 * @property {string} [filterText]
 * @property {boolean} [isSnippet]
 * @property {import("typescript").server.protocol.TextSpan} [replacementSpan]
 * @property {boolean} [hasAction]
 * @property {string} [source]
 * @property {any} [sourceDisplay] - if needed type
 * @property {any} [labelDetails] - if needed type
 * @property {boolean} [isRecommended]
 * @property {boolean} [isFromUncheckedFile]
 * @property {boolean} [isPackageJsonImport]
 * @property {boolean} [isImportStatementCompletion]
 * @property {any} [data]
 * @property {string[]} [commitCharacters]
 */

/**
 * The shape the body can be in
 * @typedef {Object} tsServerOutputBody
 * @property {number} [pid] - Optional could contain the PID number
 * @property {string} [file] - The file path
 * @property {tsServerOutputBodyDiagnostic[]} [diagnostics] - List of diagnostics
 * @property {boolean} [isIncomplete] - From completion info
 * @property {tsServerOutputBodyCompletionEntry[]} [entries] - From completion info entries
 */

/**
 * Represents a output produced by TS server output stream i.e a single parsed line from Content length all the way to next line
 * Could contains any of the below fields
 * @typedef {Object} tsServerOutput
 * @property {number} [seq] - The sequence
 * @property {"request" | "response" | "event"} [type] - What type this message is
 * @property {tsServerOutputEvent} [event] - What type of event was emitted
 * @property {tsServerOutputBody} [body] - The body of the output
 * @property {number} [request_seq] - Sequence number of the request message
 * @property {boolean} [success] - Outcome of the request
 * @property {import("typescript").server.protocol.CommandTypes} [command] - The command requested
 * @property {string} [message] - Optional message
 */

/**
 * @callback tsServerResponseCallback
 * @param {tsServerOutput} message - The message sent
 * @returns {void | Promise<void>} A promise or nothing
 */

/**
 * Register a callback to run when ts server emits a message
 * @callback onTsServerResponse
 * @param {tsServerResponseCallback} callback - The callback to run
 * @returns {voidCallback} Callback to stop running the callback passed
 */

/**
 * Writes the file to tsserver stream to watch it and emit stuff for it in the stream
 * @callback tsServerOpenFile
 * @param {string} filePath - The path to the file
 * @param {string} fileContent - The content of the file
 * @returns {void} Nothing
 */

/**
 * Writes the file to the stream as being edited
 * @callback tsServerEditFile
 * @param {import("typescript").server.protocol.ChangeRequestArgs} args
 * @returns {void} Nothing
 */

/**
 * Closes the file into the stream
 * @callback tsServerCloseFile
 * @param {string} filePath - The path to the file
 * @returns {void} Nothing
 */

/**
 * Used to stream the completion cmd into tsserver
 * @callback tsServerCompletion
 * @param {import("typescript").server.protocol.CompletionsRequestArgs} args - The args needed to the server to send to stream
 * @returns {void} Nothing
 */

/**
 * Represents a shape of an object written to tsserver stdin stream - mainly typed from typescript.d.ts
 * @typedef {object} tsServerWritableObject
 * @property {import("typescript").server.protocol.CommandTypes} command - What command to pass to TS server stdin stream
 * @property {"request"} type - Always "request" for writable messages
 * @property {number} seq - Unique request sequence number
 * @property {any} arguments - Arguments passed to tsserver; shape depends on the command look through typescript.d.ts and then the cmd name and then it's interface
 */

/**
 * Trigger error checking
 * @callback tsServerError
 * @param {string} filePath - The file to check
 * @returns {void} Nothing
 */

/**
 * Start the Typescript / Javascript language server
 * @callback tsServerStart
 * @param {string} workSpaceFolder - The selected directory
 * @returns {Promise<boolean>} If it could or could not
 */

/**
 * Stop the typescript server
 * @callback tsServerStop
 * @returns {Promise<boolean>} If it could or could not
 */

/**
 * Register to run some logic when the Typescript language server is ready
 * @callback tsServerOnReady
 * @param {voidCallback} callback - The logic you want to run
 * @returns {voidCallback} Unsub method
 */

/**
 * The Typescript / Javascript language server
 * @typedef {Object} tsServer
 * @property {onTsServerResponse} onResponse - Register callback when ts server emits a event message.
 * @property {tsServerStart} start - Start the Typescript server
 * @property {tsServerStop} stop - Stops the Typescript server
 * @property {tsServerOnReady} onReady - Run logic when the typescript server is ready
 *
 * @property {tsServerOpenFile} open - Opens a file
 * @property {tsServerEditFile} edit - Edit the file in the stream
 * @property {tsServerCloseFile} close - Close file into the stream
 * @property {tsServerCompletion} completion - Get completion data of the current file and offest into the stream
 * @property {tsServerError} errors - Trigger get error's / checking for a file
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
 *          | "textDocument/publishDiagnostics" | "textDocument/completion" | "textDocument/hover"
 * } LanguageServerProtocolMethod
 */

/**
 * Version of jsonrpc's
 * @typedef {"2.0"} LanguageServerjsonrpc
 */

/**
 * List of the valid language id's you can pass
 * @typedef {"python"} LanguageServerLanguageId
 */

/**
 * Contains all the code to interact with python language server
 * @typedef {Object} pythonServer
 * @property {pythonServerOpen} open - Open a file request
 * @property {pythonServerEdit} edit - Edit a file request
 * @property {pythonServerStart} start - Start the language server
 * @property {pythonServerStop} stop - Stop the language server
 * @property {pythonServerOnReady} onReady - Call some logic when the server becomes avaiable and is set up
 * @property {pythonServerOnResponse} onResponse - Run logic when the server responds
 */

/**
 * Represents the shape of the object sent to a JSON rpc language server indicating the document has changed
 * @typedef {Object} JSONRpcEdit
 * @property {string} filePath - The files path abs
 * @property {import("vscode-languageserver-protocol").TextDocumentContentChangeEvent[]} changes - The text documents changes
 */

/**
 * Edit a file
 * @callback pythonServerEdit
 * @param {JSONRpcEdit} edit - Edit content shape
 * @returns {void} Nothing
 */

/**
 * Being the python language server
 * @callback pythonServerStart
 * @param {string} workSpaceFolder - The path of the selcted root folder opened
 * @returns {Promise<boolean>} Nothing
 */

/**
 * Stops the python langaueg server
 * @callback pythonServerStop
 * @returns {Promise<boolean>} If it could or could not
 */

/**
 * Opens file
 * @callback pythonServerOpen
 * @param {string} filePath - The files path
 * @param {string} fileContent - The files content
 * @returns {void}
 */

/**
 * Call some logic when the python language server is ready
 * @callback pythonServerOnReady
 * @param {voidCallback} callback
 * @returns {voidCallback} UnSub method
 */

/**
 * Represents the shape the notification response object can be listing fields it can possibley have
 * @typedef {Object} JSONRpcNotification
 * @property {string} jsonrpc - Version
 * @property {LanguageServerProtocolMethod} method - Method
 * @property {JSONRpcNotificationParams} [params] - Addtional info
 */

/**
 * Represents the shape the notification params can have
 * @typedef {Object} JSONRpcNotificationParams
 * @property {string} [uri] - The files URI in the shape of for example `file:\\pie.js` encoded
 * @property {number} [version] - Version
 * @property {JSONRpcNotificationParamsDiagnostic[]} diagnostics - List of diagnostics
 */

/**
 * Represents how a diagnostic could look like inside a notification param
 * @typedef {Object} JSONRpcNotificationParamsDiagnostic
 * @property {{start: {line:number,character: number}, end: {line:number, character:number}}} range - Where the thing is located
 * @property {string} message - Infomation
 * @property {number} severity - Severity
 * @property {string} source - Which LSP it is from
 */

/**
 * The shape of the callback that is called when a message is recieved from the python server
 * @callback pythonServerOnResponseCallback
 * @param {JSONRpcNotification} message - Any message
 * @returns {void | Promise<void>} Nothing or a promise
 */

/**
 * Listen to when the server responds and run logic
 * @callback pythonServerOnResponse
 * @param {pythonServerOnResponseCallback} callback - The logic to run
 * @returns {voidCallback} unsub method
 */

/**
 * Represents the go language server
 * @typedef {Object} goServer
 * @property {goServerStart} start - Start the lsp
 * @property {goServerStop} stop - Stop the lsp
 * @property {goServerisReady} isReady - Check if the server is readfy or not
 * @property {goServerOnReady} onReady - Run logic when the server becomes ready
 * @property {goServerOnResponse} onResponse - Run logic when the go lsp produces a response
 *
 * @property {goServerOpen} open - Open a file
 * @property {goServerEdit} edit - Edit a file
 * @property {goServerCompletion} completion - Get file completions
 * @property {goServerHover} hover - Get hover information
 */

/**
 * Send a completion request
 * @callback goServerCompletion
 * @param {string} filePath - The files path
 * @param {import("vscode-languageserver-protocol").Position} position - Where the completion is taking place
 * @param {import("vscode-languageserver-protocol").CompletionContext} context - What type of completion it is
 * @returns {void} Nothing
 */

/**
 * Start the go language server
 * @callback goServerStart
 * @param {string} workSpaceFolder - The folder to open the lsp in
 * @returns {Promise<boolean>} If it could or could not
 */

/**
 * Stop the go lsp
 * @callback goServerStop
 * @returns {Promise<boolean>} If it could or could not
 */

/**
 * Indicates if the go lsp server is ready for messages
 * @callback goServerisReady
 * @returns {Promise<boolean>} If the server is ready or not for messages
 */

/**
 * Runs callback when the go server becomes ready
 * @callback goServerOnReady
 * @param {voidCallback} callback - The logic to run
 * @returns {voidCallback} unsub method
 */

/**
 * Open a file
 * @callback goServerOpen
 * @param {string} filePath - The files path
 * @param {string} fileContent - The files content
 * @returns {void} Nothing
 */

/**
 * Send a edit of a document
 * @callback goServerEdit
 * @param {JSONRpcEdit} edit - The edit
 * @returns {void} Nothing
 */

/**
 * The shape of the callback to run when the go lsp responds with a message
 * @callback goServerOnResponseCallback
 * @param {JSONRpcNotification} payload - The message from the server
 * @returns {void | Promise<void>} A promise or nothing
 */
/**
 * Run logic when the
 * @callback goServerOnResponse
 * @param {goServerOnResponseCallback} callback - The logic to run
 * @returns {voidCallback} unsub callback
 */

/**
 * Get hover information
 * @callback goServerHover
 * @param {string} filePath - The file to get the hover info for
 * @param {import("vscode-languageserver-protocol").Position} position - The cursor position at which to get it =
 * @returns {void} Nothing
 */

/**
 * Holds the values language id can be.
 *
 * It is also a way of indicating which lsp have been impl
 * @typedef {"go"} languageId
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
 */

/**
 * Get hover information
 * @callback ILanguageServerHover
 * @param {string} workSpaceFolder - The path to the work space folder i.e the folder open in root
 * @param {string} filePath - The path to the file to get hover information for
 * @param {import("vscode-languageserver-protocol").Position} position - Where to get the hover information
 * @returns {Promise<import("vscode-languageserver-protocol").Hover>} The result of a hover request.
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
 * Used try and get the main window
 * @callback getMainWindow
 * @returns {import("electron").BrowserWindow | null} The window object ref
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
 *
 * @property {ILanguageServerClientOnData} onData - Listen to when the LSP responds and run logic
 */

/**
 * Run logic when LSP responds with data
 * @callback ILanguageServerClientOnData
 * @param {LanguageServerOnDataCallback} callback
 * @returns {voidCallback} Unsub callback
 */

/**
 * Get hover information
 * @callback ILanguageServerClientHover
 * @param {string} workSpaceFolder - The path to the work space folder i.e the folder open in root
 * @param {languageId} languageId - The language
 * @param {string} filePath - The path to the file to get hover information for
 * @param {import("vscode-languageserver-protocol").Position} position - Where to get the hover information
 * @returns {Promise<import("vscode-languageserver-protocol").Hover>} The result of a hover request.
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
 * @param {any} response - The LSP response
 * @returns {void}
 */

/**
 * The callback to run when a notification has been parsed
 * @callback LanguageServerOnNotificationCallback
 * @param {any} result - The parsed notification data
 * @returns {void} Nothing
 */

/**
 * The callback to run when a response produces a error
 * @callback LanguageServerOnError
 * @param {any} error - The error parsed
 * @returns {void}
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
 * @property {tsServer} tsServer - The ts / typescript language server
 *
 * @property {shellApi} shellApi - Contains all methods to use shells
 *
 * @property {pathApi} pathApi - Contains all path utils
 *
 * @property {fsApi} fsApi - Contains all file fs utils
 *
 * @property {chromeWindowApi} chromeWindowApi - Contains all utils for chroium window itself
 *
 * @property {pythonServer} pythonServer - Contains all the api's for the python language server
 *
 * @property {urlApi} urlApi - Contains helpers todo with URL / URI's
 *
 * @property {goServer} goServer
 *
 * @property {ILanguageServerClient} lspClient - Contains all the UI api's to interact with LSP
 *
 */

/**
 * Extends the global `window` object to include the Electron API.
 *
 * @typedef {Object} EWindow
 * @property {ElectronApi} electronApi - The attached Electron API.
 */

module.exports = {};
