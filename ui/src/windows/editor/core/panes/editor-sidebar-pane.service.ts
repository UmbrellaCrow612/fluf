import { computed, Injectable, Signal, signal } from "@angular/core";
import { EditorPaneServiceBase } from "./editor-pane.base";

/**
 * Represents which pane elements from the sidebar can be in an active state,
 * i.e., the elements that can be clicked to show their rendered component.
 */
export const EDITOR_SIDE_BAR_PANE_ELEMENTS = {
  FILE_EXPLORER: "file-explorer",
  SEARCH: "search",
  SOURCE_CONTROL: "source-control",
  RUN_AND_DEBUG: "run-and-debug",
  EXTENSIONS: "extensions",
} as const;

/**
 * Contains a list of valid editor side bar active pane elements
 */
export const EDITOR_VALID_SIDEBAR_PANES = new Set<
  Exclude<editorSidebarPane, null>
>(Object.values(EDITOR_SIDE_BAR_PANE_ELEMENTS));

/**
 * Represents a valid value for the editor side bar pane element
 */
export type editorSidebarPane =
  | (typeof EDITOR_SIDE_BAR_PANE_ELEMENTS)[keyof typeof EDITOR_SIDE_BAR_PANE_ELEMENTS]
  | null;

/**
 * localStorage key used to persist the active sidebar pane
 */
const SIDEBAR_PANE_STORAGE_KEY = "editor-sidebar-pane";

/**
 * Manages the active pane displayed in the editor sidebar.
 */
@Injectable({
  providedIn: "root",
})
export class EditorSidebarPaneService extends EditorPaneServiceBase<
  Exclude<editorSidebarPane, null>
> {
  constructor() {
    super(EDITOR_VALID_SIDEBAR_PANES, SIDEBAR_PANE_STORAGE_KEY);
  }
}
