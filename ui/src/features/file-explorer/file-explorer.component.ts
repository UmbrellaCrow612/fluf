import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContextService } from '../app-context/app-context.service';
import { getElectronApi } from '../../utils';
import { CommonModule } from '@angular/common';
import { FileExplorerItemComponent } from './file-explorer-item/file-explorer-item.component';
import { collapseAllFileNodesToRoot } from './utils';

@Component({
  selector: 'app-file-explorer',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    CommonModule,
    FileExplorerItemComponent,
  ],
  templateUrl: './file-explorer.component.html',
  styleUrl: './file-explorer.component.css',
})
export class FileExplorerComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = getElectronApi();

  selectedDirectorPath: string | null = null;
  directoryFileNodes: fileNode[] | null = null;
  isExplorerActive = false;

  ngOnInit(): void {
    let init = this.appContext.getSnapshot();

    // set inital state based on ctx
    this.selectedDirectorPath = init.selectedDirectoryFolderPath;
    this.directoryFileNodes = init.directoryFileNodes;
    this.isExplorerActive =
      init.activeFileOrfolder?.path === this.selectedDirectorPath;

    // Subscribe to changes update local state
    this.appContext.autoSub(
      'selectedDirectoryFolderPath',
      (ctx) => {
        this.selectedDirectorPath = ctx.selectedDirectoryFolderPath;
      },
      this.destroyRef
    );
    this.appContext.autoSub(
      'directoryFileNodes',
      (ctx) => {
        this.directoryFileNodes = ctx.directoryFileNodes;
      },
      this.destroyRef
    );
    this.appContext.autoSub(
      'activeFileOrfolder',
      (ctx) => {
        this.isExplorerActive =
          ctx.activeFileOrfolder?.path === this.selectedDirectorPath;
      },
      this.destroyRef
    );
  }

  async openFolder() {
    let res = await this.api.selectFolder();
    if (res.canceled) {
      return;
    }

    this.appContext.update('selectedDirectoryFolderPath', res.filePaths[0]);

    await this.readDir();
  }

  /**
   * Reads selected folder path and sets file nodes globally
   */
  async readDir() {
    let nodes = await this.api.readDir(undefined, this.selectedDirectorPath!);

    this.appContext.update('directoryFileNodes', nodes);
  }

  /**
   * Runs when colapse folders is clicked will un expand all folder all the way to root
   */
  collapseFolders() {
    let ctx = this.appContext.getSnapshot();
    collapseAllFileNodesToRoot(ctx.directoryFileNodes!);
    this.appContext.update('directoryFileNodes', ctx.directoryFileNodes);
  }

  /**
   * Runs when refresh button clicked - re reads nodes and updates global state
   */
  async refreshClicked() {
    await this.readDir();
  }

  /**
   * Runs when the backdrop of the container is clicked
   */
  fileExplorerScrollContainerClicked(event: Event) {
    const target = event.target as HTMLElement;
    const container = event.currentTarget as HTMLElement;

    if (target === container) {
      /*Clicked empty space so set the file or folder focus in side bar to root node */
      this.appContext.update('activeFileOrfolder', {
        children: [],
        expanded: false,
        isDirectory: true,
        path: this.selectedDirectorPath!,
        name: 'Root ',
      });
    }
  }
}
