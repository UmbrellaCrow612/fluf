import { Component, computed, inject, OnInit } from '@angular/core';
import { EditorInMemoryContextService } from '../../editor-context/editor-in-memory-context.service';
import { OpenFileInFileX } from '../../../FileX/utils';
import { getElectronApi } from '../../../../utils';
import { fileNode } from '../../../../gen/type';
import { ApplicationContextMenuService } from '../../../../app/context-menu/application-context-menu.service';

@Component({
  selector: 'app-file-explorer-file-node-context-menu',
  imports: [],
  templateUrl: './file-explorer-file-node-context-menu.component.html',
  styleUrl: './file-explorer-file-node-context-menu.component.css',
})
export class FileExplorerFileNodeContextMenuComponent implements OnInit {
  private readonly inMemoryContextService = inject(
    EditorInMemoryContextService,
  );
  private readonly applicationContextMenuService = inject(
    ApplicationContextMenuService,
  );
  private readonly api = getElectronApi();

  private readonly contextMenuFileNode =
    this.applicationContextMenuService.getContextMenuData() as fileNode;

  error: string | null = null;

  ngOnInit(): void {
    let node = this.contextMenuFileNode as fileNode;
    if (!node || !node?.path) {
      this.error = 'Invaliud data passed';
    }
  }

  async deleteFile() {
    let node = this.contextMenuFileNode;

    let suc = await this.api.fsApi.remove(node.path);
    if (!suc) {
      this.error = 'Failed to delete file';
      return;
    }

    this.applicationContextMenuService.close();
  }

  async openFileX() {
    let node = this.contextMenuFileNode;
    if (!node) {
      this.error = 'Invaliud data passed';
      return;
    }

    await OpenFileInFileX(node);
    await this.api.fileXApi.open();
    this.applicationContextMenuService.close();
  }
}
