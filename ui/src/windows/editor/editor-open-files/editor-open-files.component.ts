import { Component, computed, inject, Signal } from '@angular/core';
import { fileNode } from '../../../gen/type';
import { EditorStateService } from '../editor-state/editor-state.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditorOpenFileItemComponent } from '../editor-open-file-item/editor-open-file-item.component';

/**
 * Displays all open files in the editor as clickable buttons and switch current view between them
 */
@Component({
  selector: 'app-editor-open-files',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    EditorOpenFileItemComponent,
  ],
  templateUrl: './editor-open-files.component.html',
  styleUrl: './editor-open-files.component.css',
})
export class EditorOpenFilesComponent {
  private readonly editorStateService = inject(EditorStateService);

  /**
   * Keeps track current open files in the editor
   */
  public readonly currentOpenFiles: Signal<fileNode[]> = computed(() => {
    return this.editorStateService.openFiles() ?? [];
  });
}
