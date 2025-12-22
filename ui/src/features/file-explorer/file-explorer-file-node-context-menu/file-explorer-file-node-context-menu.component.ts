import { Component, computed, inject, OnInit } from '@angular/core';
import { InMemoryContextService } from '../../app-context/app-in-memory-context.service';
import { fileNode } from '../../../gen/type';
import { getElectronApi } from '../../../utils';

@Component({
  selector: 'app-file-explorer-file-node-context-menu',
  imports: [],
  templateUrl: './file-explorer-file-node-context-menu.component.html',
  styleUrl: './file-explorer-file-node-context-menu.component.css',
})
export class FileExplorerFileNodeContextMenuComponent implements OnInit {
  private readonly inMemoryContextService = inject(InMemoryContextService);
  private readonly contextMenuFileNode = computed(
    () => this.inMemoryContextService.currentActiveContextMenu()?.data
  );
  private readonly api = getElectronApi();

  error: string | null = null;

  ngOnInit(): void {
    let node = this.contextMenuFileNode() as fileNode;
    if (!node || !node?.path) {
      this.error = 'Invaliud data passed';
    }
  }

  async deleteFile() {
    let node = this.contextMenuFileNode() as fileNode;

    if (!node.isDirectory) {
      let suc = await this.api.deleteFile(undefined, node.path);
      if (!suc) {
        this.error = 'Failed to delete file';
        return;
      }

      this.inMemoryContextService.currentActiveContextMenu.set(null);
    } else {
      let suc = await this.api.deleteDirectory(undefined, node.path);
      if (!suc) {
        this.error = 'Failed to delete folder';
        return;
      }

      this.inMemoryContextService.currentActiveContextMenu.set(null);
    }
  }
}
