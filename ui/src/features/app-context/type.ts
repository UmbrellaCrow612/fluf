/**
 * Represents what elements from the side bar can be in a active state i.e the elements that can be clicked to show said render component off
 */
export type sideBarActiveElement =
  | 'file-explorer'
  | 'search'
  | 'source-control'
  | 'run-and-debug'
  | 'extensions'
  | 'search-folders'
  | 'search-files'
  | null;

/**
 * The current active element to be rendered in the bottom editor pop up
 */
export type fileEditorBottomActiveElement =
  | 'terminal'
  | 'debug-console'
  | 'ports'
  | 'output'
  | 'problems';

/**
 * Contains all the context menus that can be activated
 */
export type contextMenuActiveElement =
  /** Displays when a right click is done in file explorer and on a specific file node*/ 'file-explorer-file-node-context-menu';

/**
 * Represents application wide context that persists between sessions
 */
export type AppContext = {
  /**
   * Current active sidebar element
   */
  sideBarActiveElement: sideBarActiveElement;

  /**
   * List of nodes read from the selected directory
   */
  directoryFileNodes: Array<fileNode> | null;

  /**
   * Folder path selected in the editor
   */
  selectedDirectoryPath: string | null;

  /**
   * The current focused / last clicked or last edited file (from editor) in the file explorer tree
   */
  fileExplorerActiveFileOrFolder: fileNode | null;

  /**
   * Represents whether a file or folder creator is active
   */
  isCreateFileOrFolderActive: boolean | null;

  /**
   * Indicates if it should refresh / reread nodes and update the current nodes with updated folder nodes -
   * keeps expanded state and adds / removes children based on new state
   */
  refreshDirectory: boolean | null;

  /**
   * List of open files in the editor to show in the open file tab bar
   */
  openFiles: fileNode[] | null;

  /**
   * The current file being displayed in the text file editor
   */
  currentOpenFileInEditor: fileNode | null;

  /**
   * Indicates if it should show the file editor bottom section, which contains the terminal, problems, etc.
   */
  displayFileEditorBottom: boolean | null;

  /**
   * The current active element in the file editor bottom container
   */
  fileEditorBottomActiveElement: fileEditorBottomActiveElement | null;

  /**
   * List of active shells
   */
  shells: shellInformation[] | null;

  /**
   * The current active shell to see output and input cmds in
   */
  currentActiveShellId: string | null;

  /**
   * Use a sub to listen when this is fired off - used when file explorer is resized or open file bottom is resized
   */
  isEditorResize: boolean | null;

  /**
   * The current context menu that is showing, if there is a value then said context menu will apppear else the context menu will be closed
   */
  currentActiveContextMenu: {
    /** The specific context menu to show */
    key: contextMenuActiveElement;

    /** The position to show it */
    pos: { x: number; y: number };

    /** Any data to be passed to it */
    data: Object | null;
  } | null;
};

/**
 * The callback that runs when a field changes that you sub to
 */
export type AppContextCallback = (ctx: AppContext) => void | Promise<void>;


/**
 * Represents application context that stays in memeory until a refresh or app close
 */
export type InMemoryAppContext = {

}
