import { fileNode } from '../../gen/type';
import { getElectronApi } from '../../utils';
import { FileXContextService } from './file-x-context/file-x-context.service';
import { FILE_X_STORE_DATA } from './store-key-constants';
import { FileXStoreData, FileXTab } from './types';

/**
 * Options we can pass to change it's behaviour
 */
type changeActiveDirectoryOptions = {
  /**
   * Indicates if the call for change should persisted the previous directory to the change history buffer
   */
  addToBackHistory: boolean;

  /**
   * Indicates if the call for change should add the directory to a forward history buffer
   */
  addToForwardHIstory: boolean;
};

const electronApi = getElectronApi();

/** Default options for every call  */
const defaultChangeDirectoryOptions: changeActiveDirectoryOptions = {
  addToBackHistory: true,
  addToForwardHIstory: false,
};

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
        activeTabId: tabItemToAdd.id,
        directoryContentViewMode: 'details',
        groupBy: 'NONE',
        orderBy: 'ascending',
        quickAccesses: [],
        selectedItems: [],
        showPreviews: false,
        sortBy: 'name',
        backHistoryItems: [],
        forwardHistoryItems: [],
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
      previousData.activeTabId = tabItemToAdd.id;
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
 * Removes a tab item from the tabs and also any related state with it and then trys to put the next aviable tab as active, if it cannot it will close the application
 * @param item The tab itemn to remove
 * @param service The service
 */
export function filexRemoveTabItem(
  item: FileXTab,
  service: FileXContextService,
) {
  let filteredTabs = service.tabs().filter((x) => x.id !== item.id);

  if (filteredTabs.length > 0) {
    let next = filteredTabs[0];

    filexSetTabItemAsActive(next, service);
    service.tabs.set(structuredClone(filteredTabs));

    // remove any history for it
    const forwardHistoryFiltered = service
      .forwardHistoryItems()
      .filter((x) => x.tabId !== item.id);
    service.forwardHistoryItems.set(structuredClone(forwardHistoryFiltered));

    const backHistoryFiltered = service
      .backHistoryItems()
      .filter((x) => x.tabId !== item.id);
    service.backHistoryItems.set(structuredClone(backHistoryFiltered));
  } else {
    filexResetState(service);

    setTimeout(() => {
      electronApi.chromeWindowApi.close();
    }, 10);
  }
}

/**
 * Used to reset the state of file x service fields
 * @param service The service
 */
export function filexResetState(service: FileXContextService) {
  service.activeDirectory.set('');
  service.tabs.set([]);
  service.activeTabId.set('');
  service.backHistoryItems.set([]);
  service.forwardHistoryItems.set([]);
}

/**
 * Used the change the active directory i.e current tab to the new directory tab - it will change the active directory and other fields needed.
 * Typically used for i.e going into a folder or other use cases by passing options such as going back in history or other usecases
 * @param newDirectory The new directory to set as the new active one
 * @param service The helper service
 */
export async function ChangeActiveDirectory(
  newDirectory: string,
  service: FileXContextService,
  options: Partial<changeActiveDirectoryOptions> = {},
) {
  const _options = { ...defaultChangeDirectoryOptions, ...options };

  const asNode = await electronApi.fsApi.getNode(newDirectory);
  if (!asNode.isDirectory) {
    throw new Error(
      'Passed a non directory path to be set as the active directory',
    );
  }

  const previousActiveDirectory = service.activeDirectory();
  const activeTabId = service.activeTabId();
  const tabs = service.tabs();
  const activeTab = tabs.find((x) => x.id == activeTabId);
  if (!activeTab) {
    throw new Error('Invalid state of data');
  }
  activeTab.directory = asNode.path;
  activeTab.name = asNode.name;

  service.tabs.set(structuredClone(tabs));
  service.activeDirectory.set(activeTab.directory);

  if (_options.addToBackHistory) {
    const backHistoryItems = service.backHistoryItems();
    const existing = backHistoryItems.find((x) => x.tabId === activeTabId);

    if (!existing) {
      backHistoryItems.push({
        history: [previousActiveDirectory],
        tabId: activeTab.id,
      });
    } else {
      backHistoryItems
        .find((x) => x.tabId == activeTab.id)
        ?.history.push(previousActiveDirectory);
    }

    service.backHistoryItems.set(structuredClone(backHistoryItems));
  }

  if (_options.addToForwardHIstory) {
    const forwardHistoryItems = service.forwardHistoryItems();
    const existing = forwardHistoryItems.find((x) => x.tabId == activeTabId);

    if (!existing) {
      forwardHistoryItems.push({
        history: [previousActiveDirectory],
        tabId: activeTab.id,
      });
    } else {
      forwardHistoryItems
        .find((x) => x.tabId == activeTab.id)
        ?.history.push(previousActiveDirectory);
    }

    service.forwardHistoryItems.set(structuredClone(forwardHistoryItems));
  }
}
