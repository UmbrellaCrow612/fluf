import { Component, computed, inject, OnInit } from '@angular/core';
import { EditorInMemoryContextService } from '../../app-context/editor-in-memory-context.service';
import { fileNode } from '../../../gen/type';
import { getElectronApi } from '../../../utils';
import { FileXContextService } from '../../../FileX/file-x-context/file-x-context.service';

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
  private readonly contextMenuFileNode = computed(
    () => this.inMemoryContextService.currentActiveContextMenu()?.data,
  );
  private readonly api = getElectronApi();
  private readonly fileXCtx = inject(FileXContextService);

  error: string | null = null;

  ngOnInit(): void {
    let node = this.contextMenuFileNode() as fileNode;
    if (!node || !node?.path) {
      this.error = 'Invaliud data passed';
    }
  }

  async deleteFile() {
    let node = this.contextMenuFileNode() as fileNode;

    let suc = await this.api.fsApi.remove(node.path);
    if (!suc) {
      this.error = 'Failed to delete file';
      return;
    }

    this.inMemoryContextService.currentActiveContextMenu.set(null);
  }

  async openFileX() {
    let node = this.contextMenuFileNode() as fileNode;
    if (!node || !node?.path) {
      this.error = 'Invaliud data passed';
      return;
    }

    let tabs = this.fileXCtx.tabs();
    let dirPath = node.isDirectory ? node.path : node.parentPath;

    if (!tabs.find((x) => x.baseDirectoryPath == dirPath)) {
      tabs.push({
        baseDirectoryPath: dirPath,
        name: node.parentName,
      });
      this.fileXCtx.tabs.set(structuredClone(tabs));
    }

    this.fileXCtx.currentActiveDirectory.set(dirPath);

    this.inMemoryContextService.currentActiveContextMenu.set(null);

    await this.api.fileXApi.open();
  }
}
