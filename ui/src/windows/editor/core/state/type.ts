import {
  fileNode,
  gitBlameLineInformation,
  languageId,
} from "../../../../gen/type";
import { Location } from "vscode-languageserver-protocol";

/**
 * Represents editor application-wide state that persists between sessions for the editor.
 */
export type EditorState = {};

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
   * Holds the users current selected line and column numbers in a editor text document
   */
  selectedLineAndColumn: { line: number; column: number } | null;
};
