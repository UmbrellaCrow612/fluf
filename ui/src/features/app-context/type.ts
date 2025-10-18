/**
 * Represents what elements from the side bar can be in a active state i.e the elements that can be clicked to show said render component off
 */
export type sideBarActiveElement =
  | 'file-explorer'
  | 'search'
  | 'source-control'
  | 'run-and-debug'
  | 'extensions'
  | null;

/**
 * The current active element to be rendered in the bottom editor pop up
 */
export type fileEditorBottomActiveElement = 'terminal' | "debug-console" | "ports" | "output" | "problems";
