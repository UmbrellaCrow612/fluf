import { Diagnostic } from '@codemirror/lint';
import { fileNode, languageId } from '../../../gen/type';

/**
 * Represents which elements from the sidebar can be in an active state,
 * i.e., the elements that can be clicked to show their rendered component.
 */
export type sideBarActiveElement =
  | 'file-explorer'
  | 'search'
  | 'source-control'
  | 'run-and-debug'
  | 'extensions'
  | null;

/**
 * The current active element to be rendered in the bottom editor popup.
 */
export type editorBottomActiveElement = 'terminal' | 'problems' | null;

/**
 * All the components that can be rendered in the middle of the text editor.
 *
 * - `text-file-editor` — Shown for plain txt documents without any extensions and specifically for .txt files files such as these
 */
export type editorMainActiveElement =
  | 'text-file-editor'
  | 'image-editor'
  | 'video-editor'
  | 'pdf-editor'
  | 'unkown'
  | 'code-editor'
  | null;

/**
 * Represents application-wide context that persists between sessions for the editor.
 */
export type EditorAppContext = {
  /**
   * Current active sidebar element.
   */
  sideBarActiveElement: sideBarActiveElement;

  /**
   * List of nodes read from the selected directory.
   */
  directoryFileNodes: Array<fileNode> | null;

  /**
   * Folder path selected in the editor.
   */
  selectedDirectoryPath: string | null;

  /**
   * The currently focused / last clicked or last edited file (from the editor) in the file explorer tree.
   * Used as a signal to show which file was clicked, is currently open in the editor, or as a way to show where you would
   * create a file or folder node.
   */
  fileExplorerActiveFileOrFolder: fileNode | null;

  /**
   * List of open files in the editor to show in the open file tab bar.
   */
  openFiles: fileNode[] | null;

  /**
   * The current file being displayed in the text file editor.
   */
  currentOpenFileInEditor: fileNode | null;

  /**
   * Indicates whether the file editor bottom section should be shown, which contains the terminal, problems, etc.
   */
  displayFileEditorBottom: boolean | null;

  /**
   * The current active element in the file editor bottom container.
   */
  editorBottomActiveElement: editorBottomActiveElement;

  /**
   * Represents the main component to render in the middle of the text editor,
   * such as the file text editor or other components.
   */
  editorMainActiveElement: editorMainActiveElement;

  /**
   * Represents the editor theme used to persist it between sessions.
   * It is a stringified version of a `cssVar[]` object.
   */
  editorTheme: string | null;
};

/**
 * Represents a map of specific language servers and whether they are active.
 */
export type ActiveLanguageServer = {
  [K in languageId]: boolean;
};

/**
 * Represents application context that stays in memory until a refresh or app close.
 */
export type EditorInMemoryAppContext = {
  /**
   * When its value changes, it means the editor has been resized (i.e., when it increments).
   */
  editorResize: number;

  /**
   * Indicates whether a directory being watched should be refreshed — whenever the number changes (i.e., increments), it means it should be re-read.
   */
  refreshDirectory: number;

  /**
   * Represents whether a file or folder creator is active.
   */
  isCreateFileOrFolderActive: boolean | null;

  /**
   * Contains a list of all specific files by their path and a map of specific diagnostic error types and then all the diagnostics of that type.
   */
  problems: Map<string, Diagnostic[]>;

  /**
   * Contains a list of active shell PIDs.
   */
  shells: number[] | null;

  /**
   * Contains the current shell's PID that should be shown in the UI as active.
   */
  currentActiveShellId: number | null;

  /**
   * Contains a specific shell PID and its stdout buffer collected.
   */
  terminalBuffers: Map<number, string>;

  /**
   * Used to indicate if a terminal should be created; incrementing will trigger a creation.
   */
  createTerminal: number;

  /**
   * Used to indicate whether the command palette should be visible or not.
   */
  showCommandPalette: boolean;

  /**
   * Used as a way to react when its value changes to be greater than 0; then it means reset the resize panel height to be back at 50%.
   */
  resetEditorBottomPanelDragHeight: number;
};
