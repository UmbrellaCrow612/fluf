import { FileExplorerFileNodeContextMenuComponent } from '../file-explorer/file-explorer-file-node-context-menu/file-explorer-file-node-context-menu.component';
import { ImageEditorContextMenuComponent } from '../img-editor/image-editor-context-menu/image-editor-context-menu.component';
import { TextFileEditorContextMenuComponent } from '../text-file-editor/text-file-editor-context-menu/text-file-editor-context-menu.component';
import { ContextMenuItem } from './type';

/**
 * Contains a list of context menus the application can render based on what the current key is
 */
export const contextMenuItems: ContextMenuItem[] = [
  {
    component: FileExplorerFileNodeContextMenuComponent,
    key: 'file-explorer-file-node-context-menu',
  },
  {
    component: ImageEditorContextMenuComponent,
    key: 'image-editor-img-context-menu',
  },
  {
    component: TextFileEditorContextMenuComponent,
    key: 'text-file-editor-context-menu',
  },
];
