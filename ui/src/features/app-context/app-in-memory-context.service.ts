import { Injectable, signal } from '@angular/core';
import { InMemoryAppContext } from './type';

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
export class InMemoryContextService {
  /**
   * Exposes the signal for currentActiveContextMenu field in ctx - used to react to / compute the value for this field throughout the app
   */
  readonly currentActiveContextMenu =
    signal<InMemoryAppContext['currentActiveContextMenu']>(null);

  /**
   * Exposes the signal for refreshDirectory in the ctx - used to react to / compute the value of this field throughout the app
   */
  readonly refreshDirectory = signal<InMemoryAppContext['refreshDirectory']>(0);

  /**
   * Exposes problems signal
   */
  readonly problems = signal<InMemoryAppContext['problems']>(new Map());

  /**
   * Exposes signal for isCreateFileOrFolderActive
   */
  readonly isCreateFileOrFolderActive =
    signal<InMemoryAppContext['isCreateFileOrFolderActive']>(null);

  /**
   * Exposes signal editorResize
   */
  readonly editorResize = signal<InMemoryAppContext['editorResize']>(0);

  /**
   * Exposes shells signal
   */
  readonly shells = signal<InMemoryAppContext['shells']>(null);

  /**
   * Exposes currentActiveShellId signal
   */
  readonly currentActiveShellId =
    signal<InMemoryAppContext['currentActiveShellId']>(null);

  /**
   * Exposes terminalBuffers signal
   */
  readonly terminalBuffers = signal<InMemoryAppContext['terminalBuffers']>(
    new Map(),
  );

  /**
   * Exposes createTerminal signal
   */
  readonly createTerminal = signal<InMemoryAppContext['createTerminal']>(0);

  /**
   * Exposes showCommandPalette signal
   */
  readonly showCommandPalette =
    signal<InMemoryAppContext['showCommandPalette']>(false);

  /**
   * Exposes the currentLspServer signal
   */
  readonly currentLanguageServer =
    signal<InMemoryAppContext['currentLanguageServer']>(null);

  /**
   * Exposes activeLanguageServers signal
   */
  readonly activeLanguageServers = signal<
    InMemoryAppContext['activeLanguageServers']
  >({
    'js/ts': false,
    python: false,
    go: false
  });
}
