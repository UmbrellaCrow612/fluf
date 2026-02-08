import { effect, Injectable, signal } from '@angular/core';
import {
  FileXBackHistoryItem,
  FileXDirectoryContentGroupBY,
  FileXDirectoryContentOrderBy,
  FileXDirectoryContentSortBy,
  FileXDirectoryContentViewMode,
  FileXForwardHistoryItem,
  FileXQuickAccess,
  FileXStoreData,
  FileXTab,
} from '../types';
import { FILE_X_STORE_DATA } from '../store-key-constants';
import { getElectronApi } from '../../../utils';

/**
 * Stores the file x context in a central place and offers a signal based API, this is becuase the given data is stored in a file and read from it then
 * hydrates the given exposed signals, changing the given signals will update the local file store.
 *
 * PERSISTED BETWEEN SESSIONS
 */
@Injectable({
  providedIn: 'root',
})
export class FileXContextService {
  private readonly api = getElectronApi();

  /** Whenever the store changes it emits a event which on changes listens to - whenever this happens wer retrigger / update out local state which causes a
   * write back - doing so would cause a infite loop, so whenever a change to local state is happening from on change we ignore it
   */
  private settingStateFromOnChange = false;

  /** Used to stop the first run of the ffect running which causes the current default values of the signals to be written to the saved state */
  private isInitialized = false;

  constructor() {
    this.init();

    effect(() => {
      console.log('effect ran');
      const snapshot = this.getSnapShot(); // whwver sub signal changes this triggers effect

      // Skip if not initialized yet or setting from onChange
      if (!this.isInitialized || this.settingStateFromOnChange) {
        console.log('Skipping save - not initialized or setting from onChange');
        return;
      }

      console.log('Saving to store', snapshot);
      this.api.storeApi.set(FILE_X_STORE_DATA, JSON.stringify(snapshot));
    });

    this.api.storeApi.onChange(FILE_X_STORE_DATA, (newData) => {
      console.log('on change ran');

      try {
        if (!newData) {
          console.warn('Received empty data in onChange');
          return;
        }

        const parsed: FileXStoreData = JSON.parse(newData);

        this.settingStateFromOnChange = true;
        this.setState(parsed);
      } catch (error) {
        console.error('Failed to parse store data on change', error);
      } finally {
        // Reset flag after state update completes
        setTimeout(() => {
          this.settingStateFromOnChange = false;
        }, 0);
      }
    });
  }

  /**
   * Get the current state of the store in memory by reading the current signal values
   */
  private getSnapShot(): FileXStoreData {
    return {
      tabs: this.tabs(),
      activeDirectory: this.activeDirectory(),
      activeTabId: this.activeTabId(),
      directoryContentViewMode: this.directoryContentViewMode(),
      groupBy: this.groupBy(),
      orderBy: this.orderBy(),
      quickAccesses: this.quickAccesses(),
      showPreviews: this.showPreviews(),
      sortBy: this.sortBy(),
    };
  }

  /** Trys to hydrate local signals with stored values */
  private async init() {
    try {
      this.isInitialized = false;
      this.settingStateFromOnChange = true;

      const data = await this.api.storeApi.get(FILE_X_STORE_DATA);
      if (!data) {
        console.error('No data exists for service to hydrate');
        return;
      }

      const parsed: FileXStoreData = JSON.parse(data);

      this.setState(parsed);

      setTimeout(() => {
        this.settingStateFromOnChange = false;
        this.isInitialized = true;
      }, 0);
    } catch (error) {
      console.error('Failed to load file x session data', error);
      throw error;
    }
  }

  /**
   * Sets local values of signals to those parsed from the store i.e hydrating them with the previous values
   *
   * NOTE: Whenver you add new fields make sure to re hydrate them here by setting there values like the rest, not doing so will lead to data being lost.
   */
  private setState(data: FileXStoreData) {
    this.tabs.set(data.tabs);
    this.activeDirectory.set(data.activeDirectory);
    this.activeTabId.set(data.activeTabId);
    this.directoryContentViewMode.set(data.directoryContentViewMode);
    this.sortBy.set(data.sortBy);
    this.orderBy.set(data.orderBy);
    this.groupBy.set(data.groupBy);
    this.showPreviews.set(data.showPreviews);
    this.quickAccesses.set(data.quickAccesses);
  }

  /**
   * Exposes tabs as a signal - updates to this will be persisted.
   */
  readonly tabs = signal<FileXTab[]>([]);

  /**
   * Exposes active dir as a signal - updates to this will be persisted.
   */
  readonly activeDirectory = signal('');

  /**
   * Exposes active tab id a signal - updates to this will be persisted.
   */
  readonly activeTabId = signal('');

  /**
   * Exposes dir view signal - updates to this will be persisted
   */
  readonly directoryContentViewMode =
    signal<FileXDirectoryContentViewMode>('details');

  /**
   * Exposes dir content group by signal - updates to this will be persisted
   */
  readonly groupBy = signal<FileXDirectoryContentGroupBY>('NONE');

  /**
   * Exposes order by signal - updates to this will be persisted
   */
  readonly orderBy = signal<FileXDirectoryContentOrderBy>('ascending');

  /**
   * Exposes quic access list - updates to this will be persisted
   */
  readonly quickAccesses = signal<FileXQuickAccess[]>([]);

  /**
   * Exposes if it should show previews - updates to this will be persisted
   */
  readonly showPreviews = signal<boolean>(false);

  /**
   * Exposes how the dir content should be sorted by - updates to this will be persisted
   */
  readonly sortBy = signal<FileXDirectoryContentSortBy>('name');
}
