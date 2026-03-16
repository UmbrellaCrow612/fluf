import { inject, Injectable } from '@angular/core';
import { EditorContextService } from '../../editor-context/editor-context.service';
import { getElectronApi } from '../../../../utils';

/**
 * Fixes / reset editor context state to be in a expected format
 */
@Injectable({
  providedIn: 'root',
})
export class EditorContextSateValidationService {
  private readonly editorContextService = inject(EditorContextService);
  private readonly electronApi = getElectronApi();

  /**
   * Reads the state and makes sure it is in a expected format
   */
  async EnsureStateIsValid() {
    try {
      this.validateSelectedDirectory(
        this.editorContextService.selectedDirectoryPath(),
      );
    } catch (error) {
      console.error('Failed to validate editor context ', error);
      this.editorContextService.reset();
    }
  }

  private async validateSelectedDirectory(directory: string | null) {
    if (!directory) {
      return;
    }

    if (typeof directory !== 'string') {
      this.editorContextService.selectedDirectoryPath.set(null);
      return;
    }

    if (directory.length < 1) {
      this.editorContextService.selectedDirectoryPath.set(null);
      return;
    }

    try {
      const exists = await this.electronApi.fsApi.exists(directory);
      if (!exists) {
        this.editorContextService.selectedDirectoryPath.set(null);
      }
    } catch (error) {
      console.error('Failed to validate selected directory ', directory, error);
      this.editorContextService.selectedDirectoryPath.set(null);
    }
  }
}
