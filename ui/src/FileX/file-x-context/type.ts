/**
 * Shape of data persisted between sessions for file x
 */
export type FileXAppContext = {
  /**
   * List of tab sessions opened
   */
  tabs: FileXTab[];

  /**
   * The current tab path that is active
   */
  currentActiveDirectory: string | null;
};

/**
 * Represents a tab and it's data for the given tab session
 */
export type FileXTab = {
  /**
   * The tab title
   */
  name: string;

  /**
   * The base path of the current open folder opened in the UI for the tab
   */
  baseDirectoryPath: string;
};

/** What type of item it is usch as `GIF` etc */
export type FileXTabItemType = '';

/**
 * Shape of data that lives in memeory of the serssion for file x
 */
export type FileXInMemoryContext = {};
