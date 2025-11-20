/**
 * Represents what elements from the side bar can be in a active state i.e the elements that can be clicked to show said render component off
 */
export type sideBarActiveElement =
  | 'file-explorer'
  | 'search'
  | 'source-control'
  | 'run-and-debug'
  | 'extensions'
  | 'search-folders'
  | 'search-files'
  | null;

/**
 * The current active element to be rendered in the bottom editor pop up
 */
export type fileEditorBottomActiveElement =
  | 'terminal'
  | 'debug-console'
  | 'ports'
  | 'output'
  | 'problems';

/**
 * Contains all the context menus that can be activated
 */
export type contextMenuActiveElement =
  /** Displays when a right click is done in file explorer and on a specific file node*/ 'file-explorer-file-node-context-menu';
