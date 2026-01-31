import { Injectable, signal } from '@angular/core';
import { EditorInMemoryAppContext } from './type';

/**
 * Represents information that dosent need to be persisted between sessions but within the lifecycle of the app, i.e until a refresh
 * but has the same structure to notify those who want it it's data when it changes.
 *
 * Think of it as a central store containing all signals that we can acesses from anywhere
 *
 * SHOULD not use any other services / injection as it's a base service
 */
@Injectable({
  providedIn: 'root',
})
export class EditorInMemoryContextService {
  /**
   * Exposes the signal for refreshDirectory in the ctx - used to react to / compute the value of this field throughout the app
   */
  readonly refreshDirectory = signal<EditorInMemoryAppContext['refreshDirectory']>(0);

  /**
   * Exposes problems signal
   */
  readonly problems = signal<EditorInMemoryAppContext['problems']>(new Map());

  /**
   * Exposes signal for isCreateFileOrFolderActive
   */
  readonly isCreateFileOrFolderActive =
    signal<EditorInMemoryAppContext['isCreateFileOrFolderActive']>(null);

  /**
   * Exposes signal editorResize
   */
  readonly editorResize = signal<EditorInMemoryAppContext['editorResize']>(0);

  /**
   * Exposes shells signal
   */
  readonly shells = signal<EditorInMemoryAppContext['shells']>(null);

  /**
   * Exposes currentActiveShellId signal
   */
  readonly currentActiveShellId =
    signal<EditorInMemoryAppContext['currentActiveShellId']>(null);

  /**
   * Exposes terminalBuffers signal
   */
  readonly terminalBuffers = signal<EditorInMemoryAppContext['terminalBuffers']>(
    new Map(),
  );

  /**
   * Exposes createTerminal signal
   */
  readonly createTerminal = signal<EditorInMemoryAppContext['createTerminal']>(0);

  /**
   * Exposes showCommandPalette signal
   */
  readonly showCommandPalette =
    signal<EditorInMemoryAppContext['showCommandPalette']>(false);
}
