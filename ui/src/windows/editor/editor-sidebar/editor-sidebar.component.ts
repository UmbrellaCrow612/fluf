import { Component, computed, inject, signal, Signal } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { EditorStateService } from "../core/state/editor-state.service";
import {
  EDITOR_SIDE_BAR_PANE_ELEMENTS,
  editorSidebarPane,
  EditorSidebarPaneService,
} from "../core/panes/editor-sidebar-pane.service";

/**
 * Represents a clickable side bar element
 */
type editorSideBarItem = {
  /**
   * The specific element to render on click
   */
  pane: editorSidebarPane;

  /**
   * Hover information
   */
  tooltip: string;

  /**
   * Angular material icon
   */
  icon: string;
};

/**
 * Renders a small widget on the left to allow users to switch which active component to render i.e file explorer etc
 */
@Component({
  selector: "app-editor-sidebar",
  imports: [MatButtonModule, MatIconModule, MatTooltip],
  templateUrl: "./editor-sidebar.component.html",
  styleUrl: "./editor-sidebar.component.css",
})
export class EditorSidebarComponent {
  private readonly editorSidebarPaneService = inject(EditorSidebarPaneService);

  /**
   * Keeps track of the current active side bar element
   */
  public activeElement = this.editorSidebarPaneService.pane;

  /**
   * Select a side bar item for the editor state
   * @param item The item to select in the editor state
   * @returns Nothing
   */
  public selectSidebarItem(item: editorSideBarItem) {
    const newValue = this.activeElement() === item.pane ? null : item.pane;

    this.editorSidebarPaneService.changePane(newValue);
  }

  /**
   * List of items that are clickable to switch active component in the side bar
   */
  public sideBarElements: Signal<editorSideBarItem[]> = signal([
    {
      pane: EDITOR_SIDE_BAR_PANE_ELEMENTS.FILE_EXPLORER,
      tooltip: "File explorer",
      icon: "file_copy",
    },
    {
      pane: EDITOR_SIDE_BAR_PANE_ELEMENTS.SEARCH,
      tooltip: "Search",
      icon: "search",
    },

    {
      pane: EDITOR_SIDE_BAR_PANE_ELEMENTS.SOURCE_CONTROL,
      tooltip: "Source control",
      icon: "change_history",
    },
    {
      pane: EDITOR_SIDE_BAR_PANE_ELEMENTS.RUN_AND_DEBUG,
      tooltip: "Run and debug",
      icon: "bug_report",
    },
    {
      pane: EDITOR_SIDE_BAR_PANE_ELEMENTS.EXTENSIONS,
      tooltip: "Extensions",
      icon: "extension",
    },
  ]);
}
