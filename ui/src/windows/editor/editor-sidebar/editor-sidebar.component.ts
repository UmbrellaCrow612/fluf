import { Component, computed, inject, signal, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { EditorStateService } from '../core/state/editor-state.service';
import {
  EDITOR_SIDE_BAR_ACTIVE_ELEMENT,
  editorSideBarActiveElement,
} from '../core/state/type';

/**
 * Represents a clickable side bar element
 */
type editorSideBarItem = {
  /**
   * The specific element to render on click
   */
  element: editorSideBarActiveElement;

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
  selector: 'app-editor-sidebar',
  imports: [MatButtonModule, MatIconModule, MatTooltip],
  templateUrl: './editor-sidebar.component.html',
  styleUrl: './editor-sidebar.component.css',
})
export class EditorSidebarComponent {
  private readonly editorStateService = inject(EditorStateService);

  /**
   * Keeps track of the current active side bar element
   */
  public activeElement = computed(() =>
    this.editorStateService.sideBarActiveElement(),
  );

  /**
   * Select a side bar item for the editor state
   * @param item The item to select in the editor state
   * @returns Nothing
   */
  public selectSidebarItem(item: editorSideBarItem) {
    const newValue =
      this.activeElement() === item.element ? null : item.element;

    this.editorStateService.sideBarActiveElement.set(newValue);
  }

  /**
   * List of items that are clickable to switch active component in the side bar
   */
  public sideBarElements: Signal<editorSideBarItem[]> = signal([
    {
      element: EDITOR_SIDE_BAR_ACTIVE_ELEMENT.FILE_EXPLORER,
      tooltip: 'File explorer',
      icon: 'file_copy',
    },
    {
      element: EDITOR_SIDE_BAR_ACTIVE_ELEMENT.SEARCH,
      tooltip: 'Search',
      icon: 'search',
    },

    {
      element: EDITOR_SIDE_BAR_ACTIVE_ELEMENT.SOURCE_CONTROL,
      tooltip: 'Source control',
      icon: 'change_history',
    },
    {
      element: EDITOR_SIDE_BAR_ACTIVE_ELEMENT.RUN_AND_DEBUG,
      tooltip: 'Run and debug',
      icon: 'bug_report',
    },
    {
      element: EDITOR_SIDE_BAR_ACTIVE_ELEMENT.EXTENSIONS,
      tooltip: 'Extensions',
      icon: 'extension',
    },
  ]);
}
