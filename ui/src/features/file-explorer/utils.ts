import { fileNode } from "../../gen/type";

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
 * Gets the extension from a filename.
 * @param {string} filename
 * @returns {string|null} The extension without the dot, or null if none.
 */
export function getExtension(filename: string) {
  if (typeof filename !== 'string') return null;

  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) return null;

  return filename.slice(lastDot + 1).toLowerCase();
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
 * Recursively searches for a fileNode by its path and pushes new children onto its existing children.
 *
 * @param nodes - The root list of fileNodes to search through.
 * @param targetPath - The path of the node to append children to.
 * @param newChildren - An array of new fileNodes to push.
 * @returns true if children were appended successfully, false otherwise.
 */
export function pushChildrenToNode(
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

      // Push new children (instead of replacing)
      node.children.unshift(...newChildren);
      node.expanded = true;
      return true;
    }

    // Recurse into subdirectories
    if (node.isDirectory && node.children && node.children.length > 0) {
      const appended = pushChildrenToNode(
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
 * Recursively searches for the parent node of a given file path.
 *
 * @param nodes - The root list of fileNodes to search through.
 * @param childPath - The full path of the child node whose parent is to be found.
 * @returns The parent node if found, or null if the node is at the root or not found.
 */
export function getParentNode(
  nodes: fileNode[],
  childPath: string
): fileNode | null {
  for (const node of nodes) {
    // Only directories can have children
    if (node.isDirectory && Array.isArray(node.children)) {
      // If any of this node's children match the target path → this is the parent
      if (node.children.some((child) => child.path === childPath)) {
        return node;
      }

      // Otherwise, recurse into child directories
      const foundParent = getParentNode(node.children, childPath);
      if (foundParent) {
        return foundParent;
      }
    }
  }

  return null;
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
export function collapseAllFileNodesToRoot(nodes: fileNode[]) {
  for (let node of nodes) {
    if (node.isDirectory) {
      node.expanded = false;
      node.children = [];
    }
  }
}

/**
 * Recursively searches for a fileNode by its path and sets its `expanded` to true.
 *
 * @param nodes - The root list of fileNodes to search through.
 * @param targetPath - The path of the node to expand.
 * @returns true if the node was found and updated, false otherwise.
 */
export function expandNodeByPath(
  nodes: fileNode[],
  targetPath: string
): boolean {
  for (const node of nodes) {
    if (node.path === targetPath) {
      node.expanded = true;
      return true;
    }

    if (node.isDirectory && node.children && node.children.length > 0) {
      const found = expandNodeByPath(node.children, targetPath);
      if (found) return true;
    }
  }

  return false;
}

/**
 * Recursively searches for a fileNode by its path and removes it from the node tree.
 *
 * @param nodes - The root list of fileNodes to search through.
 * @param targetPath - The path of the node to remove.
 * @returns true if the node was found and removed, false otherwise.
 */
export function removeNodeByPath(
  nodes: fileNode[],
  targetPath: string
): boolean {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (node.path === targetPath) {
      nodes.splice(i, 1); // Remove the node
      return true;
    }

    if (node.isDirectory && node.children && node.children.length > 0) {
      const removed = removeNodeByPath(node.children, targetPath);
      if (removed) return true;
    }
  }

  return false; // Node not found
}

/**
 * Recursively removes all nodes that are in "createFile" or "createFolder" mode.
 *
 * @param nodes - The root list of fileNodes to search through and modify.
 */
export function removeCreateNodes(nodes: fileNode[]): void {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];

    // Remove if node is in create mode
    if (node.mode === 'createFile' || node.mode === 'createFolder') {
      nodes.splice(i, 1);
      continue;
    }

    // Recursively check children
    if (node.isDirectory && node.children.length > 0) {
      removeCreateNodes(node.children);
    }
  }
}

/**
 * Add a file to array if it isnt in it
 * @param files Files to add to
 * @param fileToAdd File ot add
 */
export function addUniqueFile(files: fileNode[], fileToAdd: fileNode) {
  const exists = files.some((f) => f.path === fileToAdd.path);
  if (!exists) {
    files.unshift(fileToAdd);
  }
}

/**
 * Remove a file from the array if it exists
 * @param files Files to remove from
 * @param fileToRemove File to remove
 */
export function removeFileIfExists(files: fileNode[], fileToRemove: fileNode) {
  const index = files.findIndex((f) => f.path === fileToRemove.path);
  if (index !== -1) {
    files.splice(index, 1);
  }
}
