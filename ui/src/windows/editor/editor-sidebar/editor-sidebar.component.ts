import { Component, computed, inject, signal, Signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltip } from '@angular/material/tooltip';
import { EditorStateService } from '../core/state/editor-state.service';
import { sideBarActiveElement } from '../core/state/type';

/**
 * Represents a clickable side bar element
 */
type editorSideBarItem = {
  /**
   * The specific element to render on click
   */
  element: sideBarActiveElement;

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
      element: 'file-explorer',
      tooltip: 'File explorer',
      icon: 'file_copy',
    },
    {
      element: 'search',
      tooltip: 'Search',
      icon: 'search',
    },

    {
      element: 'source-control',
      tooltip: 'Source control',
      icon: 'change_history',
    },
    {
      element: 'run-and-debug',
      tooltip: 'Run and debug',
      icon: 'bug_report',
    },
    {
      element: 'extensions',
      tooltip: 'Extensions',
      icon: 'extension',
    },
  ]);
}
