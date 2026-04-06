import {
  fileNode,
  gitBlameLineInformation,
  languageId,
} from "../../../../gen/type";
import { Location } from "vscode-languageserver-protocol";

/**
 * All the components that can be rendered in the middle of the text editor.
 */
export const EDITOR_MAIN_ACTIVE_ELEMENT = {
  PLAIN_TEXT_FILE_EDITOR: "plain-text-file-editor",
  IMAGE_EDITOR: "image-editor",
  VIDEO_EDITOR: "video-editor",
  PDF_EDITOR: "pdf-editor",
  UNKNOWN: "unknown",
  AUDIO_EDITOR: "audio-editor",
  MARKDOWN_EDITOR: "markdown-editor",
} as const;

/**
 * Valid main editor elements
 */
export type editorMainActiveElement =
  | (typeof EDITOR_MAIN_ACTIVE_ELEMENT)[keyof typeof EDITOR_MAIN_ACTIVE_ELEMENT]
  | null;

/**
 * Contains a map of all valid editor main active elements
 */
export const EDITOR_VALID_MAIN_ACTIVE_ELEMENTS: Set<editorMainActiveElement> =
  new Set<any>(Object.values(EDITOR_MAIN_ACTIVE_ELEMENT));

/**
 * Represents editor application-wide state that persists between sessions for the editor.
 */
export type EditorState = {
  /**
   * The current file being displayed in the text file editor.
   */
  currentOpenFileInEditor: fileNode | null;

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

  /**
   * Keeps track if it should auto saves changes in files beofre closing
   */
  autoSave: boolean;

  /**
   * Holds the location of where to scroll to when a file is opened
   */
  scrollToDefinitionLocation: Location | null;
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
