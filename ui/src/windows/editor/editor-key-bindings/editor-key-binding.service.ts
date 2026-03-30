import { inject, Injectable } from '@angular/core';
import { KeyMaster } from 'umbr-key-master';
import { EditorStateService } from '../core/state/editor-state.service';
import { EditorInMemoryStateService } from '../core/state/editor-in-memory-state.service';

/**
 * Central configuration for all out key binding logic editor wide
 */
@Injectable({
  providedIn: 'root',
})
export class EditorKeyBindingService {
  private readonly keyMaster = new KeyMaster();
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorInMemoryStateService = inject(
    EditorInMemoryStateService,
  );

  /**
   * Initlizes key bindings for the editor application
   */
  public initKeyBindings = async () => {
    try {
      this.keyMaster.add(['Control', 'j'], () => {
        this.editorStateService.displayFileEditorBottom.update((x) => !x);
      });

      this.keyMaster.add(['Control', 's'], () => {
        this.editorInMemoryStateService.controlSaveCount.update((x) => x + 1);
      });
    } catch (error) {
      console.error('Failed to init key bindings ', error);
    }
  };
}
