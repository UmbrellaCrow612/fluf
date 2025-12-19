/*
 * Contains all helper methods to interact with file nodes
 */

import { fileNode } from '../../gen/type';

/**
 * Set expanded to false and remove all children for a set of nodes collpasing them all - modify's the orginal array
 * @param nodes The target nodes
 */
export function collapseNodes(nodes: fileNode[]) {
  nodes.forEach((x) => {
    x.children = [];
    x.expanded = false;
  });
}

/**
 * Adds the new node into the children set of the target node
 * @param nodes The list of nodes
 * @param targetNode The target node to put the new node within its children
 * @param newNode The node to add
 * @returns true if the node was inserted, false otherwise
 */
export function pushNodeIntoChildren(
  nodes: fileNode[],
  targetNode: fileNode,
  newNode: fileNode
): boolean {
  for (const node of nodes) {
    if (node.path === targetNode.path) {
      node.children.unshift(newNode);
      return true;
    }

    if (node.children.length > 0) {
      const inserted = pushNodeIntoChildren(node.children, targetNode, newNode);

      if (inserted) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get a target node's parent node
 * @param nodes The list of nodes
 * @param targetNode The target node whose parent you want
 * @returns The target node's parent node or null if not found or root-level
 */
export function getNodeParent(
  nodes: fileNode[],
  targetNode: fileNode
): fileNode | null {
  for (const node of nodes) {
    if (node.children.some(child => child.path === targetNode.path)) {
      return node;
    }

    // Recurse into children
    if (node.children.length > 0) {
      const parent = getNodeParent(node.children, targetNode);
      if (parent) {
        return parent;
      }
    }
  }

  return null;
}
