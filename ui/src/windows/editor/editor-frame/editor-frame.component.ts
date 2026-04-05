import { Component, inject, OnInit, Signal, signal } from "@angular/core";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTooltipModule } from "@angular/material/tooltip";
import { getElectronApi } from "../../../shared/electron";
import { EditorInMemoryStateService } from "../core/state/editor-in-memory-state.service";
import { EditorStateService } from "../core/state/editor-state.service";
import { MatMenuModule } from "@angular/material/menu";
import { EditorDocumentStateService } from "../core/lsp/editor-document-state.service";
import { ApplicationConfirmationService } from "../../../shared/services/application-confirmation.service";
import { EditorDocumentSavingService } from "../core/lsp/editor-document-saving.service";
import {
  EDITOR_SIDE_BAR_PANE_ELEMENTS,
  EditorSidebarPaneService,
} from "../core/panes/editor-sidebar-pane.service";
import { EditorDisplayBottomService } from "../core/panes/bottom/editor-display-bottom.service";
import { EditorBottomPaneService } from "../core/panes/bottom/editor-bottom-pane.service";

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
  selector: "app-editor-frame",
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatMenuModule,
  ],
  templateUrl: "./editor-frame.component.html",
  styleUrl: "./editor-frame.component.css",
})
export class EditorFrameComponent implements OnInit {
  private readonly electronApi = getElectronApi();
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorInMemoryStateService = inject(
    EditorInMemoryStateService,
  );
  private readonly editorDocumentStateService = inject(
    EditorDocumentStateService,
  );
  private readonly applicationConfirmationService = inject(
    ApplicationConfirmationService,
  );
  private readonly editorDocumentSavingService = inject(
    EditorDocumentSavingService,
  );
  private readonly editorSidebarPaneService = inject(EditorSidebarPaneService);
  private readonly editorDisplayBottomService = inject(
    EditorDisplayBottomService,
  );
  private readonly editorBottomPaneService = inject(EditorBottomPaneService);

  /**
   * Holds state if the given chrome window is maximized
   */
  public isMaximized = signal(false);

  public ngOnInit(): void {
    window.addEventListener("resize", async () => {
      this.isMaximized.set(
        await this.electronApi.chromeWindowApi.isMaximized(),
      );
    });
  }

  /**
   * Closes the whole chrome window instace
   */
  public async closeWindow() {
    const hasUnsavedChanges = this.editorDocumentStateService.hasAnyDirty();
    if (hasUnsavedChanges) {
      const confirmed = await this.applicationConfirmationService.request(
        "Are you sure you want to exit you have unsaved changes",
      );
      if (!confirmed) {
        return;
      }
    }

    const isSaving = this.editorDocumentSavingService.isSaving();
    if (isSaving) {
      console.warn("Cannot close window process while backend is saving");
      return;
    }

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
        label: "File",
        tooltip: "Open a file or folder",
        id: "file",
        children: [
          {
            label: "Open folder",
            onClick: async () => {
              let res = await this.electronApi.fsApi.selectFolder();
              if (res.canceled) return;

              // tood call reset then set select dir as this ro make some util
              this.editorStateService.selectedDirectoryPath.set(
                res.filePaths[0],
              );
              this.editorStateService.openFiles.set(null);
              this.editorStateService.currentOpenFileInEditor.set(null);
              this.editorStateService.editorMainActiveElement.set(null);
              this.editorStateService.fileExplorerActiveFileOrFolder.set(null);
            },
            id: "file",
          },

          {
            label: "Exit",
            onClick: () => {
              this.editorStateService.reset();
            },
            id: "exit",
          },
        ],
      },
      {
        label: "View",
        id: "view",
        children: [
          {
            label: "Command Palette",
            onClick: () => {
              this.editorInMemoryStateService.showCommandPalette.update(
                (x) => !x,
              );
            },
            id: "cmd_pal",
          },
          {
            label: "Problems",
            onClick: async () => {
              await this.editorDisplayBottomService.activatePaneAndWait("true");
              await this.editorBottomPaneService.activatePaneAndWait(
                "problems",
              );
            },
            id: "problems",
          },
          {
            label: "Terminal",
            onClick: async () => {
              await this.editorDisplayBottomService.activatePaneAndWait("true");
              await this.editorBottomPaneService.activatePaneAndWait(
                "problems",
              );
            },
            id: "terminal",
          },
          {
            label: "File explorer",
            onClick: () => {
              this.editorSidebarPaneService.activatePaneAndWait(
                EDITOR_SIDE_BAR_PANE_ELEMENTS.FILE_EXPLORER,
              );
            },
            id: "file_explor",
          },
          {
            label: "Search",
            onClick: () => {
              this.editorSidebarPaneService.activatePaneAndWait(
                EDITOR_SIDE_BAR_PANE_ELEMENTS.SEARCH,
              );
            },
            id: "search",
          },

          {
            label: "Version control",
            onClick: () => {
              this.editorSidebarPaneService.activatePaneAndWait(
                EDITOR_SIDE_BAR_PANE_ELEMENTS.SOURCE_CONTROL,
              );
            },
            id: "version_control",
          },
        ],
        tooltip: "Hanldes UI view",
      },
      {
        label: "Terminal",
        id: "terminal",
        children: [
          {
            label: "New terminal",
            onClick: async () => {
              await this.editorDisplayBottomService.activatePaneAndWait("true");
              await this.editorBottomPaneService.activatePaneAndWait(
                "problems",
              );
              this.editorInMemoryStateService.resetEditorBottomPanelDragHeight.update(
                (x) => x + 1,
              );
              this.editorInMemoryStateService.createTerminal.update(
                (x) => x + 1,
              );
            },
            id: "new_terminal",
          },
        ],
        tooltip: "Hanldes UI view",
      },
    ]);
}
