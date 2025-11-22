/**
 * Contains all helppper for working with work tree nodes
 */

import { getParentNode, pushChildrenToNode } from './utils';

/**
 * Creates a file or folder create node into the nodes
 * @param node - The node to create it at
 * @param mode - The mode to create the node in
 * @param nodes - Nodes to add it to
 */
export function addFileOrFolderNode(
  node: fileNode,
  mode: fileNodeMode,
  nodes: fileNode[]
) {
  let nodePath = node.path;

  if (!node.isDirectory) {
    nodePath = node.parentPath;
  }

  /** Node that creates a create file or folder node  */
  let newNode: fileNode = {
    children: [],
    expanded: false,
    isDirectory: false,
    mode: mode,
    name: 'Editor',
    parentPath: node.parentPath,
    path: nodePath,
  };

  if (node.isDirectory) {
    // Push under the directory
    pushChildrenToNode(nodes, node.path, [newNode]);
  } else {
    // Node is a file — find its parent
    const parent = getParentNode(nodes, node.path);
    if (parent) {
      pushChildrenToNode(nodes, parent.path, [newNode]);
    } else {
      // we are in root
      nodes.push(newNode);
    }
  }
}
