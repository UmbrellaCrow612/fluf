import { inject, Injectable } from '@angular/core';
import { EditorStateService } from './editor-state.service';
import { getElectronApi } from '../../../../utils';

/**
 * Fixes / reset editor context state to be in a expected format
 */
@Injectable({
  providedIn: 'root',
})
export class EditorSateValidationService {
  private readonly editorStateService = inject(EditorStateService);
  private readonly electronApi = getElectronApi();

  /**
   * Reads the state and makes sure it is in a expected format
   */
  async EnsureStateIsValid() {
    try {
      await this.validateSelectedDirectory(
        this.editorStateService.selectedDirectoryPath(),
      );
    } catch (error) {
      console.error('Failed to validate editor context ', error);
      this.editorStateService.reset();
    }
  }

  private async validateSelectedDirectory(directory: string | null) {
    if (!directory) {
      return;
    }

    if (typeof directory !== 'string') {
      this.editorStateService.selectedDirectoryPath.set(null);
      return;
    }

    if (directory.length < 1) {
      this.editorStateService.selectedDirectoryPath.set(null);
      return;
    }

    try {
      const exists = await this.electronApi.fsApi.exists(directory);
      if (!exists) {
        this.editorStateService.selectedDirectoryPath.set(null);
      }
    } catch (error) {
      console.error('Failed to validate selected directory ', directory, error);
      this.editorStateService.selectedDirectoryPath.set(null);
    }
  }
}
