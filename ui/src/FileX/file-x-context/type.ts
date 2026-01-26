/**
 * Shape of data persisted between sessions for file x
 */
export type FileXAppContext = {
  /**
   * List of tab sessions opened
   */
  tabs: FileXTab[];
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

  /**
   * List of items
   */
  items: FileXTabItem[];
};

/**
 * Represents a item inside a tab that can be clicked such as a directory, file, image etc
 */
export type FileXTabItem = {
  /**
   * The items name such as `example.gif`
   */
  name: string;

  /**
   * Last time it was edited
   */
  dateModified: Date;

  /**
   * What type of item it is
   */
  type: FileXTabItemType;

  /** Size of the item such as `44K` etc */
  size: string;
};

/** What type of item it is usch as `GIF` etc */
export type FileXTabItemType = '';

/**
 * Shape of data that lives in memeory of the serssion for file x
 */
export type FileXInMemoryContext = {};
