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
 * - other state stuff
 * @param filePath The path to the file to open in editor explorer
 * @param ctx The app ctx
 */
export async function OpenFileOrFolderInExplorer(
  filePath: string,
  ctx: ContextService
) {
  let nodes = ctx.directoryFileNodes() ?? [];

  let exists = nodeExists(filePath, nodes);
  if (!exists) {
  }

  expandToNode(filePath, nodes);

  let node = getNodeByPath(filePath, nodes);
  if (!node) {
    console.error('Failed to get node');
    return;
  }

  let openFiles = ctx.openFiles() ?? [];
  addNodeIfNotExists(openFiles, node);

  ctx.directoryFileNodes.set(structuredClone(nodes));
  ctx.sideBarActiveElement.set('file-explorer');

  if (!node.isDirectory) {
    ctx.openFiles.set(openFiles);
    ctx.currentOpenFileInEditor.set(node);
  }
}
