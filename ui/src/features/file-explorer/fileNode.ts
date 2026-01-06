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
 * Collapse a given node by it's path
 * @param nodes The list of nodes
 * @param targetPath The specific node to collapse
 */
export function collapseNodeByPath(
  nodes: fileNode[],
  targetPath: string,
): boolean {
  for (const node of nodes) {
    if (node.path === targetPath) {
      node.children = [];
      node.expanded = false;
      return true;
    }

    if (collapseNodeByPath(node.children, targetPath)) {
      return true;
    }
  }

  return false;
}

/**
 * Expand a given node by its path
 * @param nodes The list of nodes
 * @param targetPath The specific node to expand
 * @returns true if the node was found and expanded
 */
export function expandNodeByPath(
  nodes: fileNode[],
  targetPath: string,
): boolean {
  for (const node of nodes) {
    if (node.path === targetPath) {
      node.expanded = true;
      return true;
    }

    if (expandNodeByPath(node.children, targetPath)) {
      return true;
    }
  }

  return false;
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
  newNode: fileNode,
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
 * Push a list of nodes into a target node's children
 * @param nodes The list of nodes
 * @param targetPath The path of the node whose children will be added to
 * @param newNodes The list of nodes to add
 * @returns true if the node was found and children were added
 */
export function pushNodesIntoChildrenByPath(
  nodes: fileNode[],
  targetPath: string,
  newNodes: fileNode[],
): boolean {
  for (const node of nodes) {
    if (node.path === targetPath) {
      node.children.unshift(...newNodes);
      node.expanded = true;
      return true;
    }

    if (node.children.length > 0) {
      const inserted = pushNodesIntoChildrenByPath(
        node.children,
        targetPath,
        newNodes,
      );
      if (inserted) return true;
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
  targetNode: fileNode,
): fileNode | null {
  for (const node of nodes) {
    if (node.children.some((child) => child.path === targetNode.path)) {
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

/**
 * Removes nodes which are not in mode `default`
 * @param nodes The list of nodes
 */
export function removeCreateNodes(nodes: fileNode[]): fileNode[] {
  return nodes
    .filter((node) => node.mode === 'default')
    .map((node) => ({
      ...node,
      children: removeCreateNodes(node.children),
    }));
}

/**
 * Add a new node to the nodes if it dose not have it - NOTE it is a first layer scan not a deep search if it dose not find it, it
 * will unshift it to the nodes array else not
 * @param nodes The list of nodes
 * @param newNode
 */
export function addNodeIfNotExists(nodes: fileNode[], newNode: fileNode) {
  let found = nodes.find((x) => x.path === newNode.path);
  if (!found) {
    nodes.unshift(newNode);
  }
}
/**
 * Remove a node from the first-level nodes array if it exists
 * @param nodes The list of nodes
 * @param node The node to remove
 */
export function removeNodeIfExists(nodes: fileNode[], node: fileNode): void {
  const index = nodes.findIndex((x) => x.path === node.path);
  if (index !== -1) {
    nodes.splice(index, 1);
  }
}

/**
 * Check if a given node exists within nodes (recursive)
 * @param filePath The node file path to find
 * @param nodes Nodes to check
 */
export function nodeExists(filePath: string, nodes: fileNode[]): boolean {
  for (const node of nodes) {
    if (node.path === filePath) {
      return true;
    }

    if (node.children.length > 0) {
      const foundInChildren = nodeExists(filePath, node.children);
      if (foundInChildren) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Expands all nodes along the path to the given filePath
 * @param filePath The target node file path
 * @param nodes Root nodes
 * @returns true if the node was found in this branch
 */
export function expandToNode(filePath: string, nodes: fileNode[]): boolean {
  for (const node of nodes) {
    // If this is the target node, expand it
    if (node.path === filePath) {
      node.expanded = true;
      return true;
    }

    // Search children
    if (node.children.length > 0) {
      const foundInChildren = expandToNode(filePath, node.children);

      if (foundInChildren) {
        // Expand this node because target is in its subtree
        node.expanded = true;
        return true;
      }
    }
  }

  return false;
}

/**
 * Gets a node by its path from a tree of nodes
 * @param filePath The node file path
 * @param nodes Root nodes
 * @returns The found fileNode or null
 */
export function getNodeByPath(
  filePath: string,
  nodes: fileNode[],
): fileNode | null {
  for (const node of nodes) {
    // Check current node
    if (node.path === filePath) {
      return node;
    }

    // Search children
    if (node.children.length > 0) {
      const found = getNodeByPath(filePath, node.children);
      if (found) {
        return found;
      }
    }
  }

  return null;
}
