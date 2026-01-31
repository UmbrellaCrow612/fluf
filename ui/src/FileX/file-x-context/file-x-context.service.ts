import { effect, Injectable, signal } from '@angular/core';
import { FileXStoreData, FileXTab } from '../types';
import { getElectronApi } from '../../utils';
import { FILE_X_STORE_DATA } from '../store-key-constants';

/**
 * Stores the file x context in a central place and offers a signal based API
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
      const snapshot = this.getSnapShot();

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

  /** Get the current state of the store in memory */
  private getSnapShot(): FileXStoreData {
    return {
      tabs: this.tabs(),
      activeDirectory: this.activeDirectory(),
      activeId: this.activeTabId(),
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

  /** Sets local values of signals to those parsed from the store */
  private setState(data: FileXStoreData) {
    this.tabs.set(data.tabs);
    this.activeDirectory.set(data.activeDirectory);
    this.activeTabId.set(data.activeId);
  }

  readonly tabs = signal<FileXTab[]>([]);
  readonly activeDirectory = signal('');
  readonly activeTabId = signal('');
}
