import { Component, computed, inject, Signal } from '@angular/core';
import { EditorContextService } from '../editor-context/editor-context.service';
import { combineLatest } from 'rxjs';
import { EditorOpenFilesComponent } from "../editor-open-files/editor-open-files.component";

/**
 * Handles which component to render based on editor state such as PDF viwer component, core editor, markdown etc, open files and the bottom section which contains
 * stuff like the terminal problems etc
 */
@Component({
  selector: 'app-editor-main-content-manager',
  imports: [EditorOpenFilesComponent],
  templateUrl: './editor-main-content-manager.component.html',
  styleUrl: './editor-main-content-manager.component.css',
})
export class EditorMainContentManagerComponent {
  private readonly editorContextService = inject(EditorContextService);

  /**
   * Indicates if we should render the component that displays all current open files in the editor
   */
  public shouldRenderOpenFiles: Signal<boolean> = computed(() => {
    let files = this.editorContextService.openFiles();
    return Array.isArray(files) && files.length > 0;
  });
}
