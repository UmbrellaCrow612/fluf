import { Component, inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { getElectronApi } from '../../utils';
import { ContextService } from '../app-context/app-context.service';
import { ExplorerItemComponent } from './explorer-item/explorer-item.component';

@Component({
  selector: 'app-file-explorer',
  imports: [MatButton, ExplorerItemComponent],
  templateUrl: './file-explorer.component.html',
  styleUrl: './file-explorer.component.css',
})
export class FileExplorerComponent implements OnInit {
  private readonly _appCtx = inject(ContextService);
  private readonly _api = getElectronApi();

  /**
   * The directory to show in file explorer
   */
  selectedDirectory: string | null = null;
  isSelectingFolder = false;

  isLoadingFolder = false;
  loadingFolderError: string | null = null;
  nodes: Array<fileNode> = [];

  ngOnInit(): void {
    this.selectedDirectory = this._appCtx.context.selectedDirectoryFolderPath;
    if (this._appCtx.context.fileExplorerOpenedNodes) {
      this.nodes = this._appCtx.context.fileExplorerOpenedNodes;
    }
  }

  async openFolder() {
    this.isSelectingFolder = true;

    let res = await this._api.selectFolder();
    if (res.canceled) {
      this.isSelectingFolder = false;
      return;
    }
    this.selectedDirectory = res.filePaths[0];
    this._appCtx.update(
      'selectedDirectoryFolderPath',
      this.selectedDirectory,
      'selected-director-folder-path'
    );

    this.loadFolder();
  }

  async loadFolder() {
    this.isSelectingFolder = true;
    this.loadingFolderError = null;

    await this.readDir();
  }

  async readDir() {
    this.nodes = await this._api.readDir(undefined, this.selectedDirectory!);
    this._appCtx.update(
      'fileExplorerOpenedNodes',
      this.nodes,
      'file-explorer-opene-nodes'
    );
  }
}
