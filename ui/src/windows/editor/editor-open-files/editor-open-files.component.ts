import { Component, computed, inject, Signal } from '@angular/core';
import { fileNode } from '../../../gen/type';
import { EditorContextService } from '../editor-context/editor-context.service';

/**
 * Displays all open files in the editor as clickable buttons and switch current view between them
 */
@Component({
  selector: 'app-editor-open-files',
  imports: [],
  templateUrl: './editor-open-files.component.html',
  styleUrl: './editor-open-files.component.css',
})
export class EditorOpenFilesComponent {
  private readonly editorContextService = inject(EditorContextService);

  /**
   * Keeps track current open files in the editor
   */
  public readonly currentOpenFiles: Signal<fileNode[]> = computed(() => {
    return this.editorContextService.openFiles() ?? [];
  });
}
