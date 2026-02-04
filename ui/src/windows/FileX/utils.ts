import { fileNode } from '../../gen/type';
import { getElectronApi } from '../../utils';
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
        directoryContentViewMode: 'details',
        groupBy: 'NONE',
        orderBy: 'ascending',
        quickAccesses: [],
        selectedItems: [],
        showPreviews: false,
        sortBy: 'name',
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

/**
 * Used the change the active directory i.e current tab to the new directory tab - it will replace the previous active tab with the new one.
 * Typically used for i.e going into a folder
 * @param newDirectory The new directory to set as the new active one
 * @param service The helper service
 */
export async function ChangeActiveDirectory(
  newDirectory: string,
  service: FileXContextService,
) {
  if (!newDirectory) {
    throw new Error('No directory passed');
  }
  if (!service) {
    throw new Error('no service passed');
  }

  const activeTabId = service.activeTabId();
  const node = await electronApi.fsApi.getNode(newDirectory);

  let newTab: FileXTab = {
    directory: node.path,
    id: crypto.randomUUID(),
    name: node.name,
  };

  const currentTabs = service.tabs();
  const filtredTabs = currentTabs.filter((x) => x.id !== activeTabId);
  filtredTabs.push(newTab);

  service.tabs.set(filtredTabs);
  service.activeDirectory.set(newTab.directory);
  service.activeTabId.set(newTab.id);
}
