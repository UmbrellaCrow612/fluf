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
 * Represents the shape of data persisted between session for file x
 */
export type FileXStoreData = {
  /** List of tabs opened */
  tabs: FileXTab[];

  /**
   * The current directory path of who's content we show
   */
  activeDirectory: string;

  /**
   * The id of the tab to show - This is a `crypto.randomUUID()`,
   * this is done becuase multiple tabs can refer to the same directory and we need a unique way to id them
   * */
  activeId: string;
};

/**
 * Represents a a child split from a base path for example `c:/dev/some/other` into a child which is the given path split into sub children
 * 
 * ```bash
 * child one -> c:/dev/
 * child two -> c:/dev/some/
 * child three -> c:/dev/some/other
 * ```
 */
export type FileXDirectoryViewChild = {
  name: string;

  path: string;
};
