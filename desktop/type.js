// Defines types for the backend electron side and also then generated for the frontend side to use, on frontend side do not EDIT the generated
// type.d.ts file any changes made in type.js run npx tsc in desktop to update the UI side types they are purley generated and should only be edited via the ts cmd stated before

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
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {fsearchOptions} options Options to narrow search
 * @returns {Promise<fsearchResult[]>}
 */

/**
 * Write a image to clipboard to be pasted elsewhere
 * @callback writeImageToClipboard
 * @param {import("electron").IpcMainInvokeEvent} [event=undefined] - The Electron IPC event (used in the main process; can be ignored in the renderer process).
 * @param {string} filePath The path to the file to copy to the clipboard
 * @returns {Promise<boolean>} If it could or not copy it, if the file does not exist then false else true if it could
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
 * @returns {void} Nothing
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
 * The Typescript server, commands written to it using the methods write to the stream of the child processes and then emit said events when they are ready and parsed
 * @typedef {Object} tsServer
 * @property {onTsServerResponse} onResponse - Register callback when ts server emits a event message such as writing diagnostics or other stuff.
 * @property {tsServerOpenFile} openFile - Write file to open state within the ts server
 * @property {tsServerEditFile} editFile - Edit the file in the stream
 * @property {tsServerCloseFile} closeFile - Close file into the stream
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
 * APIs exposed to the renderer process for using Electron functions.
 *
 * @typedef {Object} ElectronApi
 *
 * @property {ripgrepApi} ripgrepApi - Contains all ripgrep related methods
 *
 * @property {gitApi} gitApi - Offers all the git func
 *
 * @property {fsearch} fsearch - Search for files or folders really fast
 *
 * @property {writeImageToClipboard} writeImageToClipboard - Write a file path to the clipboard to be pasted into other applications
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
 */

/**
 * Extends the global `window` object to include the Electron API.
 *
 * @typedef {Object} EWindow
 * @property {ElectronApi} electronApi - The attached Electron API.
 */

export {};
