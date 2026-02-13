import { inject, Injectable } from '@angular/core';
import { getElectronApi } from '../../utils';
import { OpenFileInFileX } from '../../windows/FileX/utils';
import { OpenNodeInEditor } from '../../windows/editor/file-explorer/helper';
import { EditorContextService } from '../../windows/editor/editor-context/editor-context.service';

/**
 * Acts as the central, framework-agnostic location where we register
 * command-server logic, UI-side handlers, and notification logic.
 * We use the services and logic provided by UI modules to respond to
 * command-server notifications and update the UI accordingly.
 *
 * Assumptions:
 * - We currently only need to register the callbacks for commands
 *   offered by `commandServer` once.
 * - Although the API provides an unsubscribe callback for each
 *   registration, we do not currently need to unregister anything.
 *   If this changes, update both this comment and the logic.
 *
 * SHOULD ONLY BE USED BY THE APP COMPONENT.
 */
@Injectable({
  providedIn: 'root',
})
export class CommandServerService {
  private readonly electronApi = getElectronApi();
  private readonly editorContextService = inject(EditorContextService);

  /**
   * Registers all command-server logic.
   */
  register() {
    this.electronApi.commandServer.onOpenFile(async (req) => {
      if (req.channel === 'file-x') {
        // Open the file in FileX
        const node = await this.electronApi.fsApi.getNode(req.data.filePath);
        OpenFileInFileX(node);
      }
      if (req.channel === 'editor') {
        const node = await this.electronApi.fsApi.getNode(req.data.filePath);
        if (node.isDirectory) {
          return;
        } else {
          OpenNodeInEditor(node, this.editorContextService);
        }
      }
    });
  }
}
