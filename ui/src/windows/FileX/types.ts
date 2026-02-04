import { fileNode } from "../../gen/type";

/**
 * Represents a tab folder opened in file x
 */
export type FileXTab = {
  /** The name of the folder open */
  name: string;

  /** The path to the directory this points to */
  directory: string;

  /** A unique ID  generated with `crypto.randomUUID()` */
  id: string;
};

/**
 * Represents data that lives in Memory for file x lifecycle i.e until a refresh
 */
export type FileXInMemoryData = {
  /**
   * Represents items that have been selected via a click or ctrl click i.e for multiple items
   */
  selectedItems: fileNode[];
};

/**
 * Represents the shape of data persisted between session for file x
 */
export type FileXStoreData = {
  /**
   * List of tabs opened
   */
  tabs: FileXTab[];

  /**
   * The current directory path of who's content we show
   */
  activeDirectory: string;

  /**
   * The id of the tab to show - This is a `crypto.randomUUID()`,
   * this is done becuase multiple tabs can refer to the same directory and we need a unique way to id them
   * */
  activeTabId: string;

  /**
   * Holds the view the directory content will be rendered such as tiles, details etc
   */
  directoryContentViewMode: FileXDirectoryContentViewMode;

  /**
   * Holds which way the contents of a directory will be sorted by for example by name, tag etc
   */
  sortBy: FileXDirectoryContentSortBy;

  /**
   * Holds which way to order the content of a directory after sorting them
   */
  orderBy: FileXDirectoryContentOrderBy;

  /**
   * Holds the way items should be grouped after sorting and ordering them
   */
  groupBy: FileXDirectoryContentGroupBY;

  /**
   * Indicates if it should show file content previews panel when selected
   */
  showPreviews: boolean;

  /**
   * List of items pinned for quick access
   */
  quickAccesses: FileXQuickAccess[];

  /**
   * Contains back history for specific tabs
   */
  backHistoryItems: FileXBackHistoryItem[];

  /**
   * Contains forward history for specific tabs
   */
  forwardHistoryItems: FileXForwardHistoryItem[];
};

/**
 * Represents a history item
 */
export type FileXBackHistoryItem = {
  /**
   * The specific tab it is for
   */
  tabId: string;

  /**
   * Contains a list of directory paths to go back to i.e back history - if you go into a directory then the previous directory is aded as a possible back history
   * upon going back remove said item from back history and add it to forward history
   */
  history: string[];
};

/**
 * Represents forward history for a specific tab
 */
export type FileXForwardHistoryItem = {
  /**
   * The specific tab it is for
   */
  tabId: string;

  /**
   * Contains a list of directory paths that have been added through going back in history to a previous psath the path beofre it went back is added a possible forward
   * history item i.e go forward back to it, upon going forward back to it remove said item
   */
  history: string[];
};

/**
 * Represents a child split from a base path for example `c:/dev/some/other` into a child which is the given path split into sub children
 *
 * ```bash
 * child one -> c:/dev/
 * child two -> c:/dev/some/
 * child three -> c:/dev/some/other
 * ```
 */
export type FileXDirectoryViewChild = {
  /**
   * The name of the sub child folder for example `foo`
   */
  name: string;

  /**
   * The path to `this` child's folder for example `c:/dev/foo`
   */
  path: string;
};

/**
 * Holds which mode the directory's content will be rendered such as tiles, list etc
 */
export type FileXDirectoryContentViewMode =
  | 'icons'
  | 'list'
  | 'details'
  | 'tiles'
  | 'content';

/**
 * Holds which filter to sort the entries of the directory content by
 */
export type FileXDirectoryContentSortBy =
  | 'name'
  | 'date-modified'
  | 'type'
  | 'size'
  | 'date-created'
  | 'authors'
  | 'title';

/**
 * Holds which way to order the content after sorting them
 */
export type FileXDirectoryContentOrderBy = 'ascending' | 'descending';

/**
 * Holds a way to group items after sorting and ordering them
 */
export type FileXDirectoryContentGroupBY =
  | 'NONE'
  | 'name'
  | 'date-modified'
  | 'type'
  | 'size'
  | 'date-created'
  | 'authors'
  | 'tags'
  | 'title';

/**
 * Represents a directory or item pinned for quick access
 */
export type FileXQuickAccess = {
  /**
   * The path to the directory or item pinned for quick access
   */
  path: string;
};
