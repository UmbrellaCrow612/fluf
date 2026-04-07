import { Injectable } from "@angular/core";
import { EditorPaneServiceBase } from "./editor-pane.base";

/**
 * Contains what pane the main bit of the editor can show
 */
export const EDITOR_MAIN_PANE_ELEMENTS = {
  PLAIN_TEXT_FILE_EDITOR: "plain-text-file-editor",
  IMAGE_EDITOR: "image-editor",
  VIDEO_EDITOR: "video-editor",
  PDF_EDITOR: "pdf-editor",
  UNKNOWN: "unknown",
  AUDIO_EDITOR: "audio-editor",
  MARKDOWN_EDITOR: "markdown-editor",
} as const;

/**
 * Contains valid pane elements the main bit of the editor can be
 */
const EDITOR_VALID_MAIN_PANES = new Set<Exclude<editorMainPane, null>>(
  Object.values(EDITOR_MAIN_PANE_ELEMENTS),
);

/**
 * Represents a valid value
 */
export type editorMainPane =
  | (typeof EDITOR_MAIN_PANE_ELEMENTS)[keyof typeof EDITOR_MAIN_PANE_ELEMENTS]
  | null;

/**
 * localStorage key used to persist the active sidebar pane
 */
const MAINE_PANE_STORAGE_KEY = "editor-main-pane";

/**
 * Manages the active pane show in the main section of the editor
 */
@Injectable({
  providedIn: "root",
})
export class EditorMainPaneService extends EditorPaneServiceBase<
  Exclude<editorMainPane, null>
> {
  constructor() {
    super(EDITOR_VALID_MAIN_PANES, MAINE_PANE_STORAGE_KEY);
  }
}
