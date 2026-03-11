import { fileNode } from '../../../gen/type';
import { normalizePath } from './path-uri-helpers';

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
