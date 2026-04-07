import { inject, Injectable } from "@angular/core";
import { fileNode } from "../../../../gen/type";
import { EditorStateService } from "../state/editor-state.service";
import { EditorImageService } from "./editor-image.service.service";
import { EditorVideoService } from "./editor-video.service";
import { EditorAudioService } from "./editor-audio.service";
import { normalize } from "../../../../lib/path";
import { Location as vscodeLocation } from "vscode-languageserver-protocol";
import { EditorOpenFilesService } from "../../editor-open-files/services/editor-open-files.service";
import { EditorFileExplorerService } from "../../editor-file-explorer/services/editor-file-explorer.service";
import { EditorWorkspaceService } from "../workspace/editor-workspace.service";
import {
  EDITOR_MAIN_PANE_ELEMENTS,
  editorMainPane,
  EditorMainPaneService,
} from "../panes/editor-main-pane.service";

/**
 * Manages file node interactions within the editor, including opening files,
 * tracking open files, and routing files to appropriate editor components.
 */
@Injectable({
  providedIn: "root",
})
export class EditorDocumentOpenerService {
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorImageService = inject(EditorImageService);
  private readonly editorVideoService = inject(EditorVideoService);
  private readonly editorAudioService = inject(EditorAudioService);
  private readonly editorOpenFilesService = inject(EditorOpenFilesService);
  private readonly editorFileExplorerService = inject(
    EditorFileExplorerService,
  );
  private readonly editorWorkspaceService = inject(EditorWorkspaceService);
  private readonly editorMainPaneService = inject(EditorMainPaneService);

  /**
   * Opens a file node in the editor.
   *
   * Performs the following actions:
   * - Adds the file to the list of open files (if not already present)
   * - Sets the file as the currently active file in the editor and file explorer
   * - Routes the file to the appropriate editor component based on file type
   *
   * @param target - The file node to open in the editor
   * @param [location=null] To scroll to a specific location when opening a file in the editor
   * @returns Nothing; errors are logged to console for invalid operations
   */
  public async openFileNodeInEditor(
    target: fileNode,
    location: vscodeLocation | null = null,
  ): Promise<void> {
    if (target.isDirectory) {
      console.error("Cannot open a directory in the editor");
      return;
    }

    this.addToOpenFiles(target);
    await this.setActiveFile(target);
    await this.setMainEditorComponent(target);
    this.scrollToLocation(location);
  }

  /**
   * Updates the scroll location value to trigger a scroll to with a delay
   * @param location The LSP location
   */
  private scrollToLocation(location: vscodeLocation | null = null) {
    if (!location) {
      return;
    }

    this.editorStateService.scrollToDefinitionLocation.set(location);
  }

  /**
   * Adds a file node to the list of open files if it doesn't already exist.
   * Updates the editor context with the new list of open files.
   *
   * @param target - The file node to add to open files
   */
  private addToOpenFiles(target: fileNode): void {
    this.editorOpenFilesService.open(target);
  }

  /**
   * Sets the target file as the active file in both the editor and file explorer.
   * Uses deep clone to prevent unintended reference mutations.
   *
   * @param target - The file node to set as active
   */
  private async setActiveFile(target: fileNode): Promise<void> {
    const current = this.editorWorkspaceService.document();
    if (current && normalize(current.path) === normalize(target.path)) {
      return;
    }

    await this.editorWorkspaceService.changeDocument(target);
    this.editorFileExplorerService.updateActive(target);
  }

  /**
   * Wrapper around signal set for main active element
   * @param value The valu to change it to
   */
  private async setMainActiveElementInState(
    value: editorMainPane,
  ): Promise<void> {
    const current = this.editorMainPaneService.pane();
    if (current && current === value) {
      return;
    }

    await this.editorMainPaneService.activatePaneAndWait(value);
  }

  /**
   * Determines and sets the appropriate main editor component based on file type.
   *
   * Routing logic:
   * - Image files → 'image-editor'
   * - All other files → 'text-file-editor'
   * etc
   *
   * @param target - The file node to route to an editor component
   */
  private async setMainEditorComponent(target: fileNode): Promise<void> {
    const extension = target.extension;

    if (this.editorImageService.isSupportedExtension(extension)) {
      await this.setMainActiveElementInState(
        EDITOR_MAIN_PANE_ELEMENTS.IMAGE_EDITOR,
      );
      return;
    }

    if (this.isPdf(extension)) {
      await this.setMainActiveElementInState(
        EDITOR_MAIN_PANE_ELEMENTS.PDF_EDITOR,
      );
      return;
    }

    if (this.editorAudioService.isSupportedExtension(extension)) {
      await this.setMainActiveElementInState(
        EDITOR_MAIN_PANE_ELEMENTS.AUDIO_EDITOR,
      );
      return;
    }

    if (this.editorVideoService.isSupportedExtension(extension)) {
      await this.setMainActiveElementInState(
        EDITOR_MAIN_PANE_ELEMENTS.VIDEO_EDITOR,
      );
      return;
    }

    await this.setMainActiveElementInState(
      EDITOR_MAIN_PANE_ELEMENTS.PLAIN_TEXT_FILE_EDITOR,
    );
  }

  /**
   * Check if a file extension is a PDF
   * @param extension The file extension
   */
  private isPdf(extension: string): boolean {
    return extension === ".pdf";
  }
}
