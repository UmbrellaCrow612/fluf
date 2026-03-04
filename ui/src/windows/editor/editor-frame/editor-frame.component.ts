import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { getElectronApi } from '../../../utils';
import { EditorInMemoryContextService } from '../editor-context/editor-in-memory-context.service';
import { EditorContextService } from '../editor-context/editor-context.service';
import { MatMenuModule } from '@angular/material/menu';

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
export class EditorFrameComponent {
  private readonly electronApi = getElectronApi();
  private readonly editorContextService = inject(EditorContextService);
  private readonly editorInMemoryContextService = inject(
    EditorInMemoryContextService,
  );

  /**
   * Closes the whole chrome window instace
   */
  closeWindow() {
    this.electronApi.chromeWindowApi.close();
  }

  /**
   * List of items we wan to render
   */
  editorFrameActionWithMenus: EditorFrameActionWithMenus[] = [
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

            this.editorContextService.selectedDirectoryPath.set(
              res.filePaths[0],
            );
            this.editorContextService.openFiles.set(null);
            this.editorContextService.currentOpenFileInEditor.set(null);
            this.editorContextService.editorMainActiveElement.set(null);
            this.editorContextService.fileExplorerActiveFileOrFolder.set(null);
          },
          id: 'file',
        },

        {
          label: 'Exit',
          onClick: () => {
            this.editorContextService.selectedDirectoryPath.set(null);
            this.editorContextService.openFiles.set(null);
            this.editorContextService.currentOpenFileInEditor.set(null);
            this.editorContextService.editorMainActiveElement.set(null);
            this.editorContextService.fileExplorerActiveFileOrFolder.set(null);
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
            this.editorInMemoryContextService.showCommandPalette.update(
              (x) => !x,
            );
          },
          id: 'cmd_pal',
        },
        {
          label: 'Problems',
          onClick: () => {
            this.editorContextService.displayFileEditorBottom.set(true);
            this.editorContextService.fileEditorBottomActiveElement.set(
              'problems',
            );
          },
          id: 'problems',
        },
        {
          label: 'Terminal',
          onClick: () => {
            this.editorContextService.displayFileEditorBottom.set(true);
            this.editorContextService.fileEditorBottomActiveElement.set(
              'terminal',
            );
          },
          id: 'terminal',
        },
        {
          label: 'File explorer',
          onClick: () => {
            this.editorContextService.sideBarActiveElement.set('file-explorer');
          },
          id: 'file_explor',
        },
        {
          label: 'Search',
          onClick: () => {
            this.editorContextService.sideBarActiveElement.set('search');
          },
          id: 'search',
        },
        {
          label: 'Search folders',
          onClick: () => {
            this.editorContextService.sideBarActiveElement.set(
              'search-folders',
            );
          },
          id: 'search_folder',
        },
        {
          label: 'Search files',
          onClick: () => {
            this.editorContextService.sideBarActiveElement.set('search-files');
          },
          id: 'search_file',
        },
        {
          label: 'Version control',
          onClick: () => {
            this.editorContextService.sideBarActiveElement.set(
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
            this.editorContextService.displayFileEditorBottom.set(true);
            this.editorContextService.fileEditorBottomActiveElement.set(
              'terminal',
            );
            this.editorInMemoryContextService.resetEditorBottomPanelDragHeight.update(
              (x) => x + 1,
            );

            setTimeout(() => {
              // we need a slight delay for UI to catch up
              this.editorInMemoryContextService.createTerminal.update(
                (x) => x + 1,
              );
            }, 200);
          },
          id: 'new_terminal',
        },
      ],
      tooltip: 'Hanldes UI view',
    },
  ];
}
