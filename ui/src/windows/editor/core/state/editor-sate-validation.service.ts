import { inject, Injectable } from '@angular/core';
import { EditorStateService } from './editor-state.service';
import { getElectronApi } from '../../../../shared/electron';
import { useEffect } from '../../../../lib/useEffect';
import { EDITOR_VALID_MAIN_ACTIVE_ELEMENTS } from './type';

/**
 * Severity levels for validation warnings
 */
type LogLevel = 'warn' | 'error' | 'info' | 'debug';

/**
 * Structured warning logger for editor state validation
 */
interface ValidationWarning {
  type: 'directory' | 'element' | 'state';
  issue: string;
  value?: unknown;
  action: string;
  timestamp: number;
}

/**
 * Validates and auto-corrects editor state to prevent runtime errors.
 *
 * @description
 * Automatically monitors editor state signals and resets invalid values to safe defaults.
 * Logs structured warnings for all corrections made.
 *
 * @example
 * // Manual validation after loading persisted state
 * await validationService.EnsureStateIsValid();
 */
@Injectable({
  providedIn: 'root',
})
export class EditorSateValidationService {
  private readonly editorStateService = inject(EditorStateService);
  private readonly electronApi = getElectronApi();

  /** Prefix for all validation logs to make them easily filterable in console */
  private readonly LOG_PREFIX = '[EditorStateValidation]';

  /**
   * Sets up reactive validation that runs when state changes.
   */
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
   * Manually validates all state and resets if invalid.
   * Use this after external state modifications (e.g., loading from storage).
   *
   * @returns Promise that resolves when validation completes
   */
  async EnsureStateIsValid(): Promise<void> {
    try {
      this.validateMainActiveElement(
        this.editorStateService.editorMainActiveElement(),
      );
      await this.validateSelectedDirectory(
        this.editorStateService.selectedDirectoryPath(),
      );
    } catch (error) {
      this.log('error', {
        type: 'state',
        issue: 'Critical validation failure during EnsureStateIsValid',
        value: error instanceof Error ? error.message : String(error),
        action: 'Resetting entire editor state',
        timestamp: Date.now(),
      });
      this.editorStateService.reset();
    }
  }

  /**
   * Validates directory path and resets if invalid.
   */
  private async validateSelectedDirectory(
    directory: string | null,
  ): Promise<void> {
    if (!directory) {
      return;
    }

    if (typeof directory !== 'string') {
      this.log('warn', {
        type: 'directory',
        issue: `Invalid type for directory path: expected string, got ${typeof directory}`,
        value: directory,
        action: 'Resetting selectedDirectoryPath to null',
        timestamp: Date.now(),
      });
      this.editorStateService.selectedDirectoryPath.set(null);
      return;
    }

    if (directory.length < 1) {
      this.log('warn', {
        type: 'directory',
        issue: 'Empty directory path provided',
        value: directory,
        action: 'Resetting selectedDirectoryPath to null',
        timestamp: Date.now(),
      });
      this.editorStateService.selectedDirectoryPath.set(null);
      return;
    }

    try {
      const exists = await this.electronApi.fsApi.exists(directory);
      if (!exists) {
        this.log('warn', {
          type: 'directory',
          issue: 'Directory does not exist on filesystem',
          value: directory,
          action: 'Resetting selectedDirectoryPath to null',
          timestamp: Date.now(),
        });
        this.editorStateService.selectedDirectoryPath.set(null);
      }
    } catch (error) {
      this.log('error', {
        type: 'directory',
        issue: 'Filesystem check failed during directory validation',
        value: directory,
        action: 'Resetting selectedDirectoryPath to null',
        timestamp: Date.now(),
      });
      this.editorStateService.selectedDirectoryPath.set(null);
    }
  }

  /**
   * Validates main active element and resets if invalid.
   */
  private validateMainActiveElement(element: unknown): void {
    if (element === null) {
      return;
    }

    if (typeof element !== 'string') {
      this.log('warn', {
        type: 'element',
        issue: `Invalid type for main active element: expected string, got ${typeof element}`,
        value: element,
        action: 'Resetting editorMainActiveElement to null',
        timestamp: Date.now(),
      });
      this.editorStateService.editorMainActiveElement.set(null);
      return;
    }

    if (!EDITOR_VALID_MAIN_ACTIVE_ELEMENTS.has(element as any)) {
      this.log('warn', {
        type: 'element',
        issue: 'Main active element is not in the valid set',
        value: element,
        action: 'Resetting editorMainActiveElement to null',
        timestamp: Date.now(),
      });
      this.editorStateService.editorMainActiveElement.set(null);
    }
  }

  /**
   * Structured logging with consistent formatting.
   *
   * Filter console by `[EditorStateValidation]` to see all validation logs.
   */
  private log(level: LogLevel, warning: ValidationWarning): void {
    const formattedMessage = `${this.LOG_PREFIX} [${warning.type.toUpperCase()}] ${warning.issue}`;
    const details = {
      value: warning.value,
      action: warning.action,
      timestamp: new Date(warning.timestamp).toISOString(),
    };

    switch (level) {
      case 'error':
        console.error(formattedMessage, details);
        break;
      case 'warn':
        console.warn(formattedMessage, details);
        break;
      case 'info':
        console.info(formattedMessage, details);
        break;
      case 'debug':
        console.debug(formattedMessage, details);
        break;
    }
  }
}
