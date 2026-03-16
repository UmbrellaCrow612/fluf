import { inject, Injectable } from '@angular/core';
import { fileNode } from '../../../../gen/type';
import { EditorContextService } from '../../editor-context/editor-context.service';
import { addFileNodeIfNotExists } from '../file-node-helpers';

/**
 * Used as a way to interact with file nodes / files inside the editor such as open them and other functions
 */
@Injectable({
  providedIn: 'root',
})
export class EditorFileNodeManagerService {
  private readonly editorContextService = inject(EditorContextService);

  /**
   * Opens a file node in the editor, such as adding it to open files, main text editor or custom component for it and other state stuff.
   * @param target The node to open in the editor
   * @returns Nothing
   */
  public OpenFileNodeInEditor(target: fileNode): void {
    if (target.isDirectory) {
      console.error('Cannot open a directory in the editor');
      return;
    }

    const openFiles = this.editorContextService.openFiles() ?? [];
    addFileNodeIfNotExists(openFiles, target);
    this.editorContextService.openFiles.set(structuredClone(openFiles))

    this.editorContextService.currentOpenFileInEditor.set(structuredClone(target));
    this.editorContextService.fileExplorerActiveFileOrFolder.set(structuredClone(target));

    // TODO change based on extension
    this.editorContextService.editorMainActiveElement.set('text-file-editor');
  }
}
