import { fileNode } from '../../gen/type';
import { fileDiagnosticMap } from '../language/type';
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
export type fileEditorBottomActiveElement = 'terminal' | 'problems';

/**
 * All the components it can render in the middle of the text editor
 *
 * - `text-file-editor` - Is shown for any plain text document such as code or any other
 * - `image-editor` - is shown for documents that are img formats
 * - `document-editor` - is shown when the file is a document type such as pdf etc which are supported by native browser to be shown
 */
export type editorMainActiveElement =
  | 'text-file-editor'
  | 'image-editor'
  | 'document-editor';

/**
 * Contains all the context menus that can be activated
 */
export type contextMenuActiveElement =
  /** Displays when a right click is done in file explorer and on a specific file node*/
  | 'file-explorer-file-node-context-menu'
  /** Displays context menu for when the right click is fired off inside the img editor on a img tag*/
  | 'image-editor-img-context-menu';

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
   * The current focused / last clicked or last edited file (from editor) in the file explorer tree, used as a singal toshow which file was clicked, is currently open in the editor or as a way to show where you would
   * create a file or folder node
   */
  fileExplorerActiveFileOrFolder: fileNode | null;

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
   * Represents the main component to render in the middle of the text editor such as the file text editor or other components
   */
  editorMainActiveElement: editorMainActiveElement | null;
};

/**
 * All the types of shape data can be
 */
export type CurrentActiveContextMenuData = fileNode | null | string;

/**
 * Represents application context that stays in memeory until a refresh or app close
 */
export type InMemoryAppContext = {
  /**
   * The current context menu that is showing, if there is a value then said context menu will apppear else the context menu will be closed
   */
  currentActiveContextMenu: {
    /** The specific context menu to show */
    key: contextMenuActiveElement;

    /**
     * The position of where to render the the menu
     */
    pos: { mouseX: number; mouseY: number };

    /** Any data to be passed to it */
    data: CurrentActiveContextMenuData | null;
  } | null;

  /**
   * When it's value changes it means the editor has been resized i.e when it increments it's value
   */
  editorResize: boolean | null;

  /**
   * Indicates if a directory being watched should be refreshed - whenever the number changes i.e increments it means it should be re read
   */
  refreshDirectory: number;

  /**
   * Represents whether a file or folder creator is active
   */
  isCreateFileOrFolderActive: boolean | null;

  /**
   * Contains a list of all specific file's by there path and a map of specific diagnostic error types and then all the diagnostic's of that type
   */
  problems: fileDiagnosticMap;

  /**
   * Contains a list of active shell's PID's
   */
  shells: number[] | null;

  /**
   * Contains the curent shell's PID that should be in the current UI as active
   */
  currentActiveShellId: number | null;

  /**
   * Contains a specific shell PID and it's stdout buffer collected
   */
  terminalBuffers: Map<number, string>;

  /**
   * Used to indicate if a terminal should be created incrementing will trigger a creation
   */
  createTerminal: number;

  /**
   * Used to indicate if the command palette should be visible or not
   */
  showCommandPalette: boolean
};
