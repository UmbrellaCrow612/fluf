import { Injectable, Signal, signal } from "@angular/core";
import { EditorPaneServiceBase } from "../editor-pane.base";

/**
 * Represents which elements can be active in the bottom editor pane.
 */
export const EDITOR_BOTTOM_PANE_ELEMENT = {
  TERMINAL: "terminal",
  PROBLEMS: "problems",
} as const;

/**
 * Contains a list of valid editor bottom pane elements
 */
export const EDITOR_VALID_BOTTOM_PANES = new Set<
  Exclude<editorBottomPane, null>
>(Object.values(EDITOR_BOTTOM_PANE_ELEMENT));

/**
 * Represents a valid value for the editor bottom pane element
 */
export type editorBottomPane =
  | (typeof EDITOR_BOTTOM_PANE_ELEMENT)[keyof typeof EDITOR_BOTTOM_PANE_ELEMENT]
  | null;

/**
 * localStorage key used to persist the active bottom pane
 */
const BOTTOM_PANE_STORAGE_KEY = "editor-bottom-pane";

/**
 * Manages the active pane displayed in the editor bottom panel.
 */
@Injectable({
  providedIn: "root",
})
export class EditorBottomPaneService extends EditorPaneServiceBase<
  Exclude<editorBottomPane, null>
> {
  constructor() {
    super(EDITOR_VALID_BOTTOM_PANES, BOTTOM_PANE_STORAGE_KEY);
  }
}
