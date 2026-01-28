/**
 * Represents a tab folder opened in file x
 */
export type FileXTab = {
  /** The name of the folder open */
  name: string;

  /** The path to the directory this points to */
  directory: string;
};

/**
 * Represents the shape of dat persisted between session for file x
 */
export type FileXStoreData = {
  /** List of tabs opened */
  tabs: FileXTab[];
};
