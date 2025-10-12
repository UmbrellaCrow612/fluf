import { Component, inject, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { getElectronApi } from '../../utils';
import { ContextService } from '../app-context/app-context.service';
import { JsonPipe } from '@angular/common';
import { ExplorerItemComponent } from "./explorer-item/explorer-item.component";

@Component({
  selector: 'app-file-explorer',
  imports: [MatButton, ExplorerItemComponent],
  templateUrl: './file-explorer.component.html',
  styleUrl: './file-explorer.component.css',
})
export class FileExplorerComponent implements OnInit {
  private readonly _appCtx = inject(ContextService);

  /**
   * The directory to show in file explorer
   */
  selectedDirectory: string | null = null;
  isSelectingFolder = false;

  isLoadingFolder = false;
  loadingFolderError: string | null = null;
  nodes: Array<fileNode> = [];

  ngOnInit(): void {
   
  }

  async openFolder() {
    let api = getElectronApi();

    this.isSelectingFolder = true;

    let res = await api.selectFolder();
    if (res.canceled) {
      this.isSelectingFolder = false;
      return;
    }
    this.selectedDirectory = res.filePaths[0];
    // notify reload file explo others if diffrent file path reload

    this.loadFolder();
  }

  async loadFolder() {
    this.isSelectingFolder = true;
    this.loadingFolderError = null;

    let api = getElectronApi();
    this.nodes = await api.readDir(undefined, this.selectedDirectory!);
  }
}
