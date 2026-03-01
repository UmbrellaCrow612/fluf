import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, fromEvent, Subscription } from 'rxjs';
import { MatMenuModule } from '@angular/material/menu';
import { EditorContextService } from '../editor-context/editor-context.service';
import { EditorInMemoryContextService } from '../editor-context/editor-in-memory-context.service';
import { getElectronApi } from '../../../utils';

/** Represents a top bar item such as file -> then click open folder or file */
type topBarItem = {
  /** Text to render */
  label: string;

  /** Extra info  */
  tooltip: string;

  /**
   * String value
   */
  id: string;

  /** List of children to show in the menu */
  children: {
    /** Text to render */
    label: string;

    /** Method to run when clicked */
    onClick: (() => void) | (() => Promise<void>);

    /**
     * String value
     */
    id: string;
  }[];
};

@Component({
  selector: 'app-top-bar',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule, MatMenuModule],
  templateUrl: './top-bar.component.html',
  styleUrl: './top-bar.component.css',
})
export class TopBarComponent implements OnInit, OnDestroy {
  private readonly _api = getElectronApi();
  private readonly appContext = inject(EditorContextService);
  private readonly inMemoryContextService = inject(
    EditorInMemoryContextService,
  );

  /**
   * Holds window maximized state
   */
  isMaximized = false;
  resizeSub: Subscription | null = null;

  ngOnInit(): void {
    this.resizeSub = fromEvent(window, 'resize')
      .pipe(debounceTime(250))
      .subscribe(() => {
        this.reloadMaxState();
      });
  }

  ngOnDestroy(): void {
    this.resizeSub?.unsubscribe();
  }

  /**
   * Re checks if a window is maximized for reestore
   */
  async reloadMaxState() {
    this.isMaximized = await this._api.chromeWindowApi.isMaximized();
  }
  /**
   * Minimizes screen window
   */
  minimize() {
    this._api.chromeWindowApi.minimize();
  }

  /**
   * Maximizes screen window
   */
  maximize() {
    this._api.chromeWindowApi.maximize();
  }

  restore() {
    this._api.chromeWindowApi.restore();
  }

  /**
   * Closes screen window
   */
  close() {
    this._api.chromeWindowApi.close();
  }

  items: topBarItem[] = [
    {
      label: 'File',
      tooltip: 'Open a file or folder',
      id: 'file',
      children: [
        {
          label: 'Open folder',
          onClick: async () => {
            let res = await this._api.fsApi.selectFolder();
            if (res.canceled) return;

            this.appContext.selectedDirectoryPath.set(res.filePaths[0]);
            this.appContext.openFiles.set(null);
            this.appContext.currentOpenFileInEditor.set(null);
            this.appContext.editorMainActiveElement.set(null);
            this.appContext.fileExplorerActiveFileOrFolder.set(null);
          },
          id: 'file',
        },

        {
          label: 'Exit',
          onClick: () => {
            this.appContext.selectedDirectoryPath.set(null);
            this.appContext.openFiles.set(null);
            this.appContext.currentOpenFileInEditor.set(null);
            this.appContext.editorMainActiveElement.set(null);
            this.appContext.fileExplorerActiveFileOrFolder.set(null);
          },
          id: 'exit',
        },
      ],
    },
    {
      label: 'View',
      id: 'view',
      children: [
        {
          label: 'Command Palette',
          onClick: () => {
            this.inMemoryContextService.showCommandPalette.update((x) => !x);
          },
          id: 'cmd_pal',
        },
        {
          label: 'Problems',
          onClick: () => {
            this.appContext.displayFileEditorBottom.set(true);
            this.appContext.fileEditorBottomActiveElement.set('problems');
          },
          id: 'problems',
        },
        {
          label: 'Terminal',
          onClick: () => {
            this.appContext.displayFileEditorBottom.set(true);
            this.appContext.fileEditorBottomActiveElement.set('terminal');
          },
          id: 'terminal',
        },
        {
          label: 'File explorer',
          onClick: () => {
            this.appContext.sideBarActiveElement.set('file-explorer');
          },
          id: 'file_explor',
        },
        {
          label: 'Search',
          onClick: () => {
            this.appContext.sideBarActiveElement.set('search');
          },
          id: 'search',
        },
        {
          label: 'Search folders',
          onClick: () => {
            this.appContext.sideBarActiveElement.set('search-folders');
          },
          id: 'search_folder',
        },
        {
          label: 'Search files',
          onClick: () => {
            this.appContext.sideBarActiveElement.set('search-files');
          },
          id: 'search_file',
        },
        {
          label: 'Version control',
          onClick: () => {
            this.appContext.sideBarActiveElement.set('source-control');
          },
          id: 'version_control',
        },
      ],
      tooltip: 'Hanldes UI view',
    },
    {
      label: 'Terminal',
      id: 'terminal',
      children: [
        {
          label: 'New terminal',
          onClick: () => {
            this.appContext.displayFileEditorBottom.set(true);
            this.appContext.fileEditorBottomActiveElement.set('terminal');
            this.inMemoryContextService.resetEditorBottomPanelDragHeight.update(
              (x) => x + 1,
            );

            setTimeout(() => {
              // we need a slight delay for UI to catch up
              this.inMemoryContextService.createTerminal.update((x) => x + 1);
            }, 200);
          },
          id: 'new_terminal',
        },
      ],
      tooltip: 'Hanldes UI view',
    },
  ];
}
