import { inject, Injectable } from '@angular/core';
import { fileNode } from '../../../../gen/type';
import { EditorContextService } from '../../editor-context/editor-context.service';
import { addFileNodeIfNotExists } from '../file-node-helpers';
import { EditorImageService } from './editor-image.service.service';

/**
 * Manages file node interactions within the editor, including opening files,
 * tracking open files, and routing files to appropriate editor components.
 */
@Injectable({
  providedIn: 'root',
})
export class EditorFileNodeManagerService {
  private readonly editorContextService = inject(EditorContextService);
  private readonly editorImageService = inject(EditorImageService);

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
    const openFiles = this.editorContextService.openFiles() ?? [];
    addFileNodeIfNotExists(openFiles, target);
    this.editorContextService.openFiles.set(structuredClone(openFiles));
  }

  /**
   * Sets the target file as the active file in both the editor and file explorer.
   * Uses deep clone to prevent unintended reference mutations.
   *
   * @param target - The file node to set as active
   */
  private setActiveFile(target: fileNode): void {
    const clonedTarget = structuredClone(target);
    this.editorContextService.currentOpenFileInEditor.set(clonedTarget);
    this.editorContextService.fileExplorerActiveFileOrFolder.set(clonedTarget);
  }

  /**
   * Determines and sets the appropriate main editor component based on file type.
   *
   * Routing logic:
   * - Image files → 'image-editor'
   * - All other files → 'text-file-editor'
   *
   * @param target - The file node to route to an editor component
   */
  private setMainEditorComponent(target: fileNode): void {
    if (this.editorImageService.isSupportedExtension(target.extension)) {
      this.editorContextService.editorMainActiveElement.set('image-editor');
      return;
    }

    if (this.isPdf(target.extension)) {
      this.editorContextService.editorMainActiveElement.set('pdf-editor');
      return;
    }

    this.editorContextService.editorMainActiveElement.set('text-file-editor');
  }

  /**
   * Check if a file extension is a PDF
   * @param extension The file extension
   */
  private isPdf(extension: string): boolean {
    return extension === '.pdf';
  }
}
