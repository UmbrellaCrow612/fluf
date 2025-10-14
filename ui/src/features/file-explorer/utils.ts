/**
 * Gets the file extension of a given path if it is supported.
 * Returns null for directories, files without an extension, or unsupported extensions.
 *
 * @param {string} path - The file path to check.
 * @returns {SupportedFileExtensions} The file extension or null if unsupported.
 */
export function getFileExtension(path: string): SupportedFileExtensions {
  if (!path || typeof path !== 'string') return null;

  // Remove trailing slashes
  path = path.replace(/\/+$/, '');

  // Get last part of path
  const parts = path.split('/');
  const lastPart = parts[parts.length - 1];

  // Check for dot in file name
  const dotIndex = lastPart.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === 0) return null;

  const ext = lastPart.slice(dotIndex + 1).toLowerCase();

  // Only allow html, css, js
  if (ext === 'html' || ext === 'css' || ext === 'js') {
    return ext;
  }

  return null;
}

/**
 * List of supported file extenions
 */
export type SupportedFileExtensions = 'html' | 'css' | 'js' | null;

/**
 * Recursively searches for a fileNode by its path and appends new children to it.
 *
 * @param nodes - The root list of fileNodes to search through.
 * @param targetPath - The path of the node to append children to.
 * @param newChildren - An array of new fileNodes to append.
 * @returns true if children were appended successfully, false otherwise.
 */
export function appendChildrenToNode(
  nodes: fileNode[],
  targetPath: string,
  newChildren: fileNode[]
): boolean {
  for (const node of nodes) {
    if (node.path === targetPath) {
      // Ensure children array exists
      if (!Array.isArray(node.children)) {
        node.children = [];
      }

      // Append new children
      node.children = newChildren;
      node.expanded = true; 
      return true;
    }

    // Recurse into subdirectories
    if (node.isDirectory && node.children && node.children.length > 0) {
      const appended = appendChildrenToNode(
        node.children,
        targetPath,
        newChildren
      );
      if (appended) return true;
    }
  }

  return false;
}

/**
 * Recursively searches for a fileNode by its path and sets its `expanded` to false.
 *
 * @param nodes - The root list of fileNodes to search through.
 * @param targetPath - The path of the node to collapse.
 * @returns true if the node was found and updated, false otherwise.
 */
export function collapseNodeByPath(
  nodes: fileNode[],
  targetPath: string
): boolean {
  for (const node of nodes) {
    if (node.path === targetPath) {
      node.expanded = false;
      node.children = [];
      return true;
    }

    if (node.isDirectory && node.children && node.children.length > 0) {
      const found = collapseNodeByPath(node.children, targetPath);
      if (found) return true;
    }
  }

  return false;
}

/**
 * Collapse all expanded file nodes - will set it back to root nodes only
 * @param nodes The nodes to affect these will be changed
 */
export function collapseAllFileNodesToRoot(nodes:fileNode[]){
  for(let node of nodes){
    if(node.isDirectory){
      node.expanded = false;
      node.children = []
    }
  }
}