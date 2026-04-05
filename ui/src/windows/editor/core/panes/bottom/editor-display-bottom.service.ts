import { Injectable, Signal, signal } from "@angular/core";
import { EditorPaneServiceBase } from "../editor-pane.base";

/**
 * Represents which elements can be active
 */
export const EDITOR_DISPLAY_BOTTOM_PANE_VALUE = {
  TRUE: "true",
  FALSE: "false",
} as const;

/**
 * Contains a list of valid elements
 */
export const EDITOR_VALID_DISPLAY_BOTTOM_VALUES = new Set<
  Exclude<editorDisplayBottomPane, null>
>(Object.values(EDITOR_DISPLAY_BOTTOM_PANE_VALUE));

/**
 * Represents a valid value
 */
export type editorDisplayBottomPane =
  | (typeof EDITOR_DISPLAY_BOTTOM_PANE_VALUE)[keyof typeof EDITOR_DISPLAY_BOTTOM_PANE_VALUE]
  | null;

/**
 * localStorage key used to persist
 */
const DISPLAY_BOTTOM_PANE_STORAGE_KEY = "editor-display-bottom-pane";

/**
 * Manages if the editor bottom component itself is rendered
 */
@Injectable({
  providedIn: "root",
})
export class EditorDisplayBottomService extends EditorPaneServiceBase<
  Exclude<editorDisplayBottomPane, null>
> {
  constructor() {
    super(EDITOR_VALID_DISPLAY_BOTTOM_VALUES, DISPLAY_BOTTOM_PANE_STORAGE_KEY);
  }
}
