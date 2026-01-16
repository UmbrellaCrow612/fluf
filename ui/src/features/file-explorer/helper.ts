/*
 * Contains helpers that other features can use
 */

import { fileNode } from '../../gen/type';
import { getElectronApi } from '../../utils';
import { ContextService } from '../app-context/app-context.service';
import { hasDocumentExtension } from '../document-editor/utils';
import { hasImageExtension } from '../img-editor/utils';
import {
  addNodeIfNotExists,
  expandToNode,
  getNodeByPath,
  nodeExists,
} from './fileNode';

const electronApi = getElectronApi();

/**
 * Opens the given file or folder into the file explorer does the following
 * - Sets the current side bar active elements to explorer
 * - Find the given node by search through the current nodes and expanding to it
 * - Sets it as active
 * - If it could not find it - recursive fetch nodes until it find it then does the above
 * @param filePath The path to the file to open in editor explorer
 * @param ctx The app ctx
 */
export async function OpenFileOrFolderInExplorer(
  filePath: string,
  ctx: ContextService,
) {
  let nodes = ctx.directoryFileNodes() ?? [];
  let selectedDir = ctx.selectedDirectoryPath();

  if (!selectedDir) {
    console.error('No selected directory ');
    return;
  }

  let exists = nodeExists(filePath, nodes);
  if (!exists) {
    // we will have at least the first folder decendent if the given file path is within this project, as reading selected dir itself will read the first decendent node

    let parentPath = await getFirstFolderAfterBase(selectedDir, filePath);

    let node = getNodeByPath(parentPath, nodes);

    if (!node) {
      console.error('First decent folder path not found in root folder');
      return;
    }

    await recursiveFetchUntilFound(node, filePath, nodes);
  }

  expandToNode(filePath, nodes);

  let node = getNodeByPath(filePath, nodes);
  if (!node) {
    console.error('Failed to get node');
    return;
  }

  ctx.directoryFileNodes.set(structuredClone(nodes));
  ctx.sideBarActiveElement.set('file-explorer');

  if (!node.isDirectory) {
    let openFiles = ctx.openFiles() ?? [];
    addNodeIfNotExists(openFiles, node);

    ctx.openFiles.set(structuredClone(openFiles));
    ctx.currentOpenFileInEditor.set(node);
    ctx.editorMainActiveElement.set('text-file-editor');
  }
}

/**
 * Recursively fetches children of nodes until the target file path is found
 * @param node The current node to fetch children for
 * @param targetFilePath The file path we're looking for
 * @param rootNodes The root nodes array (for reference)
 */
async function recursiveFetchUntilFound(
  node: fileNode,
  targetFilePath: string,
  rootNodes: fileNode[],
): Promise<boolean> {
  // If this node's path matches the target, we're done
  if (node.path === targetFilePath) {
    return true;
  }

  // If the target path doesn't start with this node's path, it's not in this subtree
  const normalizedNodePath = await electronApi.pathApi.normalize(node.path);
  const normalizedTargetPath = await electronApi.pathApi.normalize(targetFilePath);

  if (!normalizedTargetPath.startsWith(normalizedNodePath)) {
    return false;
  }

  // Fetch children for this node if it's a directory
  if (node.isDirectory) {
    try {
      const newChildren = await electronApi.fsApi.readDir(node.path);

      // Update the node's children
      node.children = newChildren;
      node.expanded = true;

      // Check if the target is directly in the children
      for (const child of node.children) {
        if (child.path === targetFilePath) {
          return true;
        }
      }

      // Recursively search in children that might contain the target
      for (const child of node.children) {
        if (child.isDirectory) {
          const found = await recursiveFetchUntilFound(
            child,
            targetFilePath,
            rootNodes,
          );
          if (found) {
            return true;
          }
        }
      }
    } catch (error) {
      console.error(`Failed to read directory: ${node.path}`, error);
      return false;
    }
  }

  return false;
}

/**
 * Gets the first folder after the base path from a descendant path
 * @param {string} basePath - The base path (e.g., 'C:/dev/resize')
 * @param {string} descendantPath - A path that is a descendant of the base path (e.g., 'C:/dev/resize/one/two.js')
 * @returns {Promise<string>} The path up to and including the first folder after the base path (e.g., 'C:/dev/resize/one/')
 */
async function getFirstFolderAfterBase(
  basePath: string,
  descendantPath: string,
): Promise<string> {
  const normalizedBase = await electronApi.pathApi.normalize(basePath);
  const normalizedDescendant = await electronApi.pathApi.normalize(descendantPath);

  const relativePath = await electronApi.pathApi.relative(
    normalizedBase,
    normalizedDescendant,
  );

  if (
    relativePath.startsWith('..') ||
    await electronApi.pathApi.isAbsolute(relativePath)
  ) {
    throw new Error('descendantPath is not a descendant of basePath');
  }

  let seperator = await electronApi.pathApi.sep();

  const segments = relativePath.split(seperator);
  const firstFolder = segments[0];

  const result = await electronApi.pathApi.join(normalizedBase, firstFolder);

  return result;
}

/**
 * Open a node in the editor - handles opening a code editor, img editor or other editors
 * use it if you click a node in file explorer or file tab or other places
 * @param fileNode The file node clicked
 * @param ctx The app ctx
 */
export function OpenNodeInEditor(fileNode: fileNode, ctx: ContextService) {
  ctx.currentOpenFileInEditor.set(fileNode);
  ctx.fileExplorerActiveFileOrFolder.set(fileNode);

  let openFiles = ctx.openFiles() ?? [];
  addNodeIfNotExists(openFiles, fileNode);

  ctx.openFiles.set(structuredClone(openFiles)); // for js ref change

  let isImg = hasImageExtension(fileNode.extension);
  if (isImg) {
    ctx.editorMainActiveElement.set('image-editor');
    return;
  }

  let isDoc = hasDocumentExtension(fileNode.extension);
  if (isDoc) {
    ctx.editorMainActiveElement.set('document-editor');
    return;
  }

  ctx.editorMainActiveElement.set('text-file-editor');
}
