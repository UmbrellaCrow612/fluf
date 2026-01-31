import { fileNode } from '../gen/type';
import { getElectronApi } from '../utils';
import { FileXContextService } from './file-x-context/file-x-context.service';
import { FILE_X_STORE_DATA } from './store-key-constants';
import { FileXStoreData, FileXTab } from './types';

const electronApi = getElectronApi();

/**
 * Opens the given file in file x - if it was already open in the previous session then it is not opened again.
 * @param fileNode The specific file to open
 */
export async function OpenFileInFileX(fileNode: fileNode): Promise<void> {
  try {
    const raw = await electronApi.storeApi.get(FILE_X_STORE_DATA);

    const dirPath = fileNode.isDirectory ? fileNode.path : fileNode.parentPath;
    const name = fileNode.isDirectory ? fileNode.name : fileNode.parentName;

    const tabItemToAdd: FileXTab = {
      name: name,
      directory: dirPath,
      id: crypto.randomUUID(),
    };

    if (typeof raw !== 'string' || raw.length === 0) {
      const sessionData: FileXStoreData = {
        tabs: [tabItemToAdd],
        activeDirectory: dirPath,
        activeId: tabItemToAdd.id,
      };

      await electronApi.storeApi.set(
        FILE_X_STORE_DATA,
        JSON.stringify(sessionData),
      );
      return;
    }

    const previousData: FileXStoreData = JSON.parse(raw);

    const alreadyOpen = previousData.tabs.some((x) => x.directory === dirPath);

    if (!alreadyOpen) {
      previousData.tabs.push(tabItemToAdd);
      previousData.activeDirectory = tabItemToAdd.directory;
      previousData.activeId = tabItemToAdd.id;
    }

    await electronApi.storeApi.set(
      FILE_X_STORE_DATA,
      JSON.stringify(previousData),
    );
  } catch (error) {
    console.error('Failed to open file in File X', error);
    throw error;
  }
}

/**
 * Used as a way to set a given tab item as active - this is done so anywhere where tab item active state changes we can re use it becuase certain fields
 * may need to be changed in future
 * @param item The item to set as the active tab
 * @param service Used to run the logic needed
 */
export function filexSetTabItemAsActive(
  item: FileXTab,
  service: FileXContextService,
) {
  service.activeDirectory.set(item.directory);
  service.activeTabId.set(item.id);
}

/**
 * Used to reset the state of file x service fields
 * @param service The service
 */
export function filexResetState(service: FileXContextService) {
  service.activeDirectory.set('');
  service.tabs.set([]);
  service.activeTabId.set('');
}
