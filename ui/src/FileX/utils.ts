import { fileNode } from '../gen/type';
import { getElectronApi } from '../utils';
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
      previousData.activeDirectory = dirPath;
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
