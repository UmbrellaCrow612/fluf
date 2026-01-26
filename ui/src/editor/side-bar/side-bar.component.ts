import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EditorContextService } from '../app-context/editor-context.service';
import { sideBarActiveElement } from '../app-context/type';

type sideBarElement = {
  element: sideBarActiveElement;
  tooltip: string;
  icon: string;
};

@Component({
  selector: 'app-side-bar',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css',
})
export class SideBarComponent {
  private readonly _appCtx = inject(EditorContextService);

  sideBarElements: sideBarElement[] = [
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
      element: 'search-folders',
      tooltip: 'Search folders',
      icon: 'tab_search',
    },
    {
      element: 'search-files',
      tooltip: 'Search files',
      icon: 'find_in_page',
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
  ];

  /**
   * Keeps track of the current active side bar element
   */
  activeElement = computed(() => this._appCtx.sideBarActiveElement());

  toggleElement(element: sideBarActiveElement) {
    const newValue = this.activeElement() === element ? null : element;

    this._appCtx.sideBarActiveElement.set(newValue);
  }
}
