import { Component, inject, OnInit, Signal, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getElectronApi } from '../../../shared/electron';
import { EditorInMemoryStateService } from '../core/state/editor-in-memory-state.service';
import { EditorStateService } from '../core/state/editor-state.service';
import { MatMenuModule } from '@angular/material/menu';
import {
  EDITOR_BOTTOM_ACTIVE_ELEMENT,
  EDITOR_SIDE_BAR_ACTIVE_ELEMENT,
} from '../core/state/type';

/**
 * Represents a item in the frame that is clickable and displays a menu of options
 */
type EditorFrameActionWithMenus = {
  /**
   * Text to render
   */
  label: string;

  /** 
   Extra info  
   */
  tooltip: string;

  /**
   * String value
   */
  id: string;

  /**
   * List of children to show in the menu
   */
  children: {
    /**
     * Text to render
     */
    label: string;

    /**
     * Method to run when clicked
     */
    onClick: (() => void) | (() => Promise<void>);

    /**
     * String value
     */
    id: string;
  }[];
};

/**
 * Acts as the frmae users can close, minimize and restore editor size as well as drag on with mouse
 */
@Component({
  selector: 'app-editor-frame',
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  templateUrl: './editor-frame.component.html',
  styleUrl: './editor-frame.component.css',
})
export class EditorFrameComponent implements OnInit {
  private readonly electronApi = getElectronApi();
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorInMemoryStateService = inject(
    EditorInMemoryStateService,
  );

  /**
   * Holds state if the given chrome window is maximized
   */
  public isMaximized = signal(false);

  public ngOnInit(): void {
    window.addEventListener('resize', async () => {
      this.isMaximized.set(
        await this.electronApi.chromeWindowApi.isMaximized(),
      );
    });
  }

  /**
   * Closes the whole chrome window instace
   */
  public closeWindow() {
    this.electronApi.chromeWindowApi.close();
  }

  /**
   * Minimizes the current window
   */
  public minimizeWindow() {
    this.electronApi.chromeWindowApi.minimize();
  }

  /**
   * Based on the current state of the window will maximize the window or restore it
   */
  public maximizerOrRestoreWindow() {
    if (this.isMaximized()) {
      this.electronApi.chromeWindowApi.restore();
    } else {
      this.electronApi.chromeWindowApi.maximize();
    }
  }

  /**
   * List of items we wan to render
   */
  public editorFrameActionWithMenus: Signal<EditorFrameActionWithMenus[]> =
    signal([
      {
        label: 'File',
        tooltip: 'Open a file or folder',
        id: 'file',
        children: [
          {
            label: 'Open folder',
            onClick: async () => {
              let res = await this.electronApi.fsApi.selectFolder();
              if (res.canceled) return;

              this.editorStateService.selectedDirectoryPath.set(
                res.filePaths[0],
              );
              this.editorStateService.openFiles.set(null);
              this.editorStateService.currentOpenFileInEditor.set(null);
              this.editorStateService.editorMainActiveElement.set(null);
              this.editorStateService.fileExplorerActiveFileOrFolder.set(null);
            },
            id: 'file',
          },

          {
            label: 'Exit',
            onClick: () => {
              this.editorStateService.reset();
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
              this.editorInMemoryStateService.showCommandPalette.update(
                (x) => !x,
              );
            },
            id: 'cmd_pal',
          },
          {
            label: 'Problems',
            onClick: () => {
              this.editorStateService.displayFileEditorBottom.set(true);
              this.editorStateService.editorBottomActiveElement.set('problems');
            },
            id: 'problems',
          },
          {
            label: 'Terminal',
            onClick: () => {
              this.editorStateService.displayFileEditorBottom.set(true);
              this.editorStateService.editorBottomActiveElement.set(
                EDITOR_BOTTOM_ACTIVE_ELEMENT.TERMINAL,
              );
            },
            id: 'terminal',
          },
          {
            label: 'File explorer',
            onClick: () => {
              this.editorStateService.sideBarActiveElement.set(
                EDITOR_SIDE_BAR_ACTIVE_ELEMENT.FILE_EXPLORER,
              );
            },
            id: 'file_explor',
          },
          {
            label: 'Search',
            onClick: () => {
              this.editorStateService.sideBarActiveElement.set('search');
            },
            id: 'search',
          },

          {
            label: 'Version control',
            onClick: () => {
              this.editorStateService.sideBarActiveElement.set(
                'source-control',
              );
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
              this.editorStateService.displayFileEditorBottom.set(true);
              this.editorStateService.editorBottomActiveElement.set(
                EDITOR_BOTTOM_ACTIVE_ELEMENT.TERMINAL,
              );
              this.editorInMemoryStateService.resetEditorBottomPanelDragHeight.update(
                (x) => x + 1,
              );

              setTimeout(() => {
                // we need a slight delay for UI to catch up
                this.editorInMemoryStateService.createTerminal.update(
                  (x) => x + 1,
                );
              }, 200);
            },
            id: 'new_terminal',
          },
        ],
        tooltip: 'Hanldes UI view',
      },
    ]);
}
