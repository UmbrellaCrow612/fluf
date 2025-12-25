/*
 * Contains helpers that other features can use
 */

import { getElectronApi } from '../../utils';
import { ContextService } from '../app-context/app-context.service';
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
  ctx: ContextService
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
    console.log(parentPath);

    let node = getNodeByPath(parentPath, nodes);
    console.log(node);

    if (!node) {
      console.error('First decent folder path not found in root folder');
      return;
    }

    // recuisve fetch child for the given nodes and it's children until we find the filepath passed in the children

    for(const children of node.children){
      let newChildren = await electronApi.readDir(undefined, parentPath)
    }

    return;
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

    ctx.openFiles.set(openFiles);
    ctx.currentOpenFileInEditor.set(node);
  }
}

/**
 * Gets the first folder after the base path from a descendant path
 * @param {string} basePath - The base path (e.g., 'C:/dev/resize')
 * @param {string} descendantPath - A path that is a descendant of the base path (e.g., 'C:/dev/resize/one/two.js')
 * @returns {Promise<string>} The path up to and including the first folder after the base path (e.g., 'C:/dev/resize/one/')
 */
async function getFirstFolderAfterBase(
  basePath: string,
  descendantPath: string
): Promise<string> {
  const normalizedBase = await electronApi.pathApi.normalize(basePath);
  const normalizedDescendant = await electronApi.pathApi.normalize(
    descendantPath
  );

  const relativePath = await electronApi.pathApi.relative(
    normalizedBase,
    normalizedDescendant
  );

  if (
    relativePath.startsWith('..') ||
    (await electronApi.pathApi.isAbsolute(relativePath))
  ) {
    throw new Error('descendantPath is not a descendant of basePath');
  }

  let seperator = await electronApi.pathApi.sep();

  const segments = relativePath.split(seperator);
  const firstFolder = segments[0];

  const result = await electronApi.pathApi.join(normalizedBase, firstFolder);

  return result;
}
