import { inject, Injectable } from '@angular/core';
import { fileNode } from '../../../../gen/type';
import { EditorStateService } from '../../core/state/editor-state.service';
import { EditorImageService } from './editor-image.service.service';
import { EditorVideoService } from './editor-video.service';
import { EditorAudioService } from './editor-audio.service';
import { addFileNodeIfNotExists } from '../../../../shared/file-node-helpers';
import {
  EDITOR_MAIN_ACTIVE_ELEMENT,
  editorMainActiveElement,
} from '../state/type';

/**
 * Manages file node interactions within the editor, including opening files,
 * tracking open files, and routing files to appropriate editor components.
 */
@Injectable({
  providedIn: 'root',
})
export class EditorFileOpenerService {
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorImageService = inject(EditorImageService);
  private readonly editorVideoService = inject(EditorVideoService);
  private readonly editorAudioService = inject(EditorAudioService);

  /**
   * Opens a file node in the editor.
   *
   * Performs the following actions:
   * - Adds the file to the list of open files (if not already present)
   * - Sets the file as the currently active file in the editor and file explorer
   * - Routes the file to the appropriate editor component based on file type
   *
   * @param target - The file node to open in the editor
   * @returns Nothing; errors are logged to console for invalid operations
   */
  public openFileNodeInEditor(target: fileNode): void {
    if (target.isDirectory) {
      console.error('Cannot open a directory in the editor');
      return;
    }

    this.addToOpenFiles(target);
    this.setActiveFile(target);
    this.setMainEditorComponent(target);
  }

  /**
   * Adds a file node to the list of open files if it doesn't already exist.
   * Updates the editor context with the new list of open files.
   *
   * @param target - The file node to add to open files
   */
  private addToOpenFiles(target: fileNode): void {
    const openFiles = this.editorStateService.openFiles() ?? [];
    addFileNodeIfNotExists(openFiles, target);
    this.editorStateService.openFiles.set(structuredClone(openFiles));
  }

  /**
   * Sets the target file as the active file in both the editor and file explorer.
   * Uses deep clone to prevent unintended reference mutations.
   *
   * @param target - The file node to set as active
   */
  private setActiveFile(target: fileNode): void {
    const clonedTarget = structuredClone(target);
    this.editorStateService.currentOpenFileInEditor.set(clonedTarget);
    this.editorStateService.fileExplorerActiveFileOrFolder.set(clonedTarget);
  }

  /**
   * Wrapper around signal set for main active element
   * @param value The valu to change it to
   */
  private setMainActiveElementInState(value: editorMainActiveElement) {
    this.editorStateService.editorMainActiveElement.set(value);
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
  private setMainEditorComponent(target: fileNode): void {
    const extension = target.extension;

    if (this.editorImageService.isSupportedExtension(extension)) {
      this.setMainActiveElementInState(EDITOR_MAIN_ACTIVE_ELEMENT.IMAGE_EDITOR);
      return;
    }

    if (this.isPdf(extension)) {
      this.setMainActiveElementInState(EDITOR_MAIN_ACTIVE_ELEMENT.PDF_EDITOR);
      return;
    }

    if (this.editorAudioService.isSupportedExtension(extension)) {
      this.setMainActiveElementInState(EDITOR_MAIN_ACTIVE_ELEMENT.AUDIO_EDITOR);
      return;
    }

    if (this.editorVideoService.isSupportedExtension(extension)) {
      this.setMainActiveElementInState(EDITOR_MAIN_ACTIVE_ELEMENT.VIDEO_EDITOR);
      return;
    }

    if (this.isTextDocumentOrHasNoExtension(extension)) {
      this.setMainActiveElementInState(
        EDITOR_MAIN_ACTIVE_ELEMENT.PLAIN_TEXT_FILE_EDITOR,
      );
      return;
    }

    if (this.hasAnyExtension(extension)) {
      this.setMainActiveElementInState(EDITOR_MAIN_ACTIVE_ELEMENT.CODE_EDITOR);
      return;
    }

    this.setMainActiveElementInState(null);
  }

  /**
   * Check if a file extension is a PDF
   * @param extension The file extension
   */
  private isPdf(extension: string): boolean {
    return extension === '.pdf';
  }

  /**
   * Checks if a file extension is a `txt` or it is empty
   * @param extension The file extension
   */
  private isTextDocumentOrHasNoExtension(extension: string): boolean {
    return extension === '.txt' || extension.trim() === '';
  }

  /**
   * Checks if a file extension is a file extension of any type at least and none empty
   * @param extension The file extension
   */
  private hasAnyExtension(extension: string): boolean {
    return extension.trim() !== '' && extension.indexOf('.') > 0;
  }
}
