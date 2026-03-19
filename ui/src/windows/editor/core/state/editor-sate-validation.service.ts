import { inject, Injectable } from '@angular/core';
import { EditorStateService } from './editor-state.service';
import { getElectronApi } from '../../../../shared/electron';
import { useEffect } from '../../../../lib/useEffect';
import { EDITOR_VALID_MAIN_ACTIVE_ELEMENTS } from './type';

/**
 * Fixes / reset editor context state to be in a expected format
 */
@Injectable({
  providedIn: 'root',
})
export class EditorSateValidationService {
  private readonly editorStateService = inject(EditorStateService);
  private readonly electronApi = getElectronApi();

  constructor() {
    useEffect(
      (_, element) => {
        this.validateMainActiveElement(element);
      },
      [this.editorStateService.editorMainActiveElement],
    );

    useEffect(
      async (_, path) => {
        await this.validateSelectedDirectory(path);
      },
      [this.editorStateService.selectedDirectoryPath],
    );
  }

  /**
   * Reads the state and makes sure it is in a expected format
   */
  async EnsureStateIsValid() {
    try {
      this.validateMainActiveElement(
        this.editorStateService.editorMainActiveElement(),
      );
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

  private validateMainActiveElement(element: unknown) {
    if (element === null) {
      return;
    }

    if (typeof element !== 'string') {
      this.editorStateService.editorMainActiveElement.set(null);
      return;
    }

    if (!EDITOR_VALID_MAIN_ACTIVE_ELEMENTS.has(element as any)) {
      console.log('Main active element changed to a non valid value reseting');
      this.editorStateService.editorMainActiveElement.set(null);
    }
  }
}
