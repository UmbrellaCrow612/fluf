import { fileNode } from '../../../gen/type';
import { normalizePath } from './path-uri-helpers';

/**
 * Collapse all nodes at the first layer by clearing their children and setting expanded to false
 * @param nodes The list of nodes to collapse
 * @returns Nothing - modifies the original array
 */
export function collapseFileNodeFirstLayer(nodes: fileNode[]): void {
  for (const node of nodes) {
    node.children = [];
    node.expanded = false;
  }
}

/**
 * Remove a target node by it's path
 * @param nodes The list of nodes to remove the target node from
 * @param target The node to remove
 * @returns Nothing - modifies the orginal array
 */
export function removeFileNodeIfExists(
  nodes: fileNode[],
  target: fileNode,
): void {
  const index = nodes.findIndex(
    (node) => normalizePath(node.path) === normalizePath(target.path),
  );
  if (index !== -1) {
    nodes.splice(index, 1);
  }
}

/**
 * Add a node to the list only if a node with the same path doesn't already exist
 * @param nodes The list of nodes to add to
 * @param target The node to add
 * @returns Nothing - modifies the original array
 */
export function addFileNodeIfNotExists(
  nodes: fileNode[],
  target: fileNode,
): void {
  const exists = nodes.some(
    (node) => normalizePath(node.path) === normalizePath(target.path),
  );
  if (!exists) {
    nodes.push(target);
  }
}

/**
 * Recursively search through nodes and their children to replace a matching node
 * @param nodes The list of nodes to search through
 * @param target The node to replace (matched by path)
 * @param replacement The node to replace it with
 * @returns True if the node was found and replaced, false otherwise
 */
export function replaceFileNode(
  nodes: fileNode[],
  target: fileNode,
  replacement: fileNode,
): boolean {
  for (let i = 0; i < nodes.length; i++) {
    if (normalizePath(nodes[i].path) === normalizePath(target.path)) {
      nodes[i] = replacement;
      return true;
    }

    if (nodes[i].children?.length > 0) {
      const replaced = replaceFileNode(nodes[i].children, target, replacement);
      if (replaced) return true;
    }
  }

  return false;
}

/**
 * Recursively remove all nodes with none default mode i.e create file folder rename etc
 * @param nodes The list of nodes to filter
 * @returns Nothing - modifies the original array
 */
export function removeTempoaryFileNodes(nodes: fileNode[]): void {
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (nodes[i].children?.length > 0) {
      removeTempoaryFileNodes(nodes[i].children);
    }

    if (nodes[i].mode !== 'default') {
      nodes.splice(i, 1);
    }
  }
}

/**
 * Find a node by its path (recursively searches through children)
 * @param nodes The list of nodes to search through
 * @param path The path to search for
 * @returns The matching node or undefined if not found
 */
export function findFileNodeByPath(
  nodes: fileNode[],
  path: string,
): fileNode | undefined {
  const normalizedTargetPath = normalizePath(path);

  for (const node of nodes) {
    if (normalizePath(node.path) === normalizedTargetPath) {
      return node;
    }

    if (node.children?.length > 0) {
      const found = findFileNodeByPath(node.children, path);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}
