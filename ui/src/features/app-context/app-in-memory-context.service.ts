import { DestroyRef, Injectable, signal } from '@angular/core';
import { InMemoryAppContext, InMemoryAppContextCallback } from './type';
import { voidCallback } from '../../gen/type';

/**
 * Represents information that dosent need to be persisted between sessions but within the lifecycle of the app, i.e until a refresh
 * but has the same structure to notify those who want it it's data when it changes.
 *
 * Thin of it as a central store containing all signals that we can acesses from anywhere
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
   * Exposes signal isEditorResize
   */
  readonly isEditorResize = signal<InMemoryAppContext['isEditorResize']>(null);
}
