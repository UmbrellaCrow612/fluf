import { Injectable, signal } from '@angular/core';
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

  constructor() {
    this.init();

    this.api.storeApi.onChange(FILE_X_STORE_DATA, (newData) => {
      try {
        if (!newData) {
          console.warn('Received empty data in onChange');
          return;
        }
        
        const parsed: FileXStoreData = JSON.parse(newData);
        this.setState(parsed);
      } catch (error) {
        console.error('Failed to parse store data on change', error);
      }
    });
  }

  private async init() {
    console.log('File x hydration ran');
    try {
      const data = await this.api.storeApi.get(FILE_X_STORE_DATA);
      if (!data) {
        console.error('No data exists for service to hydrate');
        return;
      }

      const parsed: FileXStoreData = JSON.parse(data);
      this.setState(parsed);
    } catch (error) {
      console.error('Failed to load file x session data', error);
      throw error;
    }
  }

  private setState(data: FileXStoreData) {
    this.tabs.set(data.tabs);
    this.activeDirectory.set(data.activeDirectory);
  }

  readonly tabs = signal<FileXTab[]>([]);
  readonly activeDirectory = signal('');
}