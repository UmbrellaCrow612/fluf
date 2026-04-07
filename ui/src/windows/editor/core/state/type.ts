import {
  fileNode,
  gitBlameLineInformation,
  languageId,
} from "../../../../gen/type";
import { Location } from "vscode-languageserver-protocol";

/**
 * Represents editor application-wide state that persists between sessions for the editor.
 */
export type EditorState = {
  /**
   * Keeps track if it should auto saves changes in files beofre closing
   */
  autoSave: boolean;
};

/**
 * Represents a map of specific language servers and whether they are active.
 */
export type ActiveLanguageServer = {
  [K in languageId]: boolean;
};

/**
 * Represents editor application state that stays in memory until a refresh or app close.
 */
export type EditorInMemoryState = {
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

  /**
   * Holds how many times ctrl s is ran whenever it it ran / triggred this is incremenent used to allows other parts of the app to respond to the event
   * agnosticly by reading this value as a dep
   */
  controlSaveCount: number;

  /**
   * Holds the users current selected line and column numbers in a editor text document
   */
  selectedLineAndColumn: { line: number; column: number } | null;

  /**
   * Holds the current git blame information for the cusor line
   */
  gitBlameLineInformation: gitBlameLineInformation | null;
};
