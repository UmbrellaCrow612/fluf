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
    // the parent folder if this is hit will aways be a sub folde rnot yet opened as root dir awlays fetches eveything within it
    // get the parent folder that would have it from the file path provided from root so if root is c:/dev/resize and the provided one c:/dev/resize/parentOnefolder/file.txt
    // we get the fiorst folder from root which is parentOnefolder
    // then it makes c:/dev/resize/parentOnefolder as the path we need
    // we then recusive fetch nodes making tree for that until we fetch the given file or folder nodes as part of it's children
    // then we replace global nodes
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