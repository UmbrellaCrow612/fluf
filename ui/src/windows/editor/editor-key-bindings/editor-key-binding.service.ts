import { inject, Injectable } from '@angular/core';
import { KeyMaster } from 'umbr-key-master';
import { EditorContextService } from '../editor-context/editor-context.service';

/**
 * Central configuration for all out key binding logic editor wide
 */
@Injectable({
  providedIn: 'root',
})
export class EditorKeyBindingService {
  private readonly keyMaster = new KeyMaster();
  private readonly editorContextService = inject(EditorContextService);

  /**
   * Initlizes key bindings for the editor application
   */
  public initKeyBindings = async () => {
    try {
      this.keyMaster.add(['Control', 'j'], () => {
        this.editorContextService.displayFileEditorBottom.update((x) => !x);
      });
    } catch (error) {
      console.error('Failed to init key bindings ', error);
    }
  };
}
