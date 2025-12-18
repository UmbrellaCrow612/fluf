import { Component, computed, DestroyRef, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContextService } from '../app-context/app-context.service';
import { sideBarActiveElement } from '../app-context/type';

@Component({
  selector: 'app-side-bar',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css',
})
export class SideBarComponent {
  private readonly _appCtx = inject(ContextService);

  /**
   * Keeps track of the current active side bar element
   */
  activeElement = computed(() => this._appCtx.sideBarActiveElement());

  private toggleElement(element: sideBarActiveElement) {
    const newValue = this.activeElement() === element ? null : element;

    this._appCtx.sideBarActiveElement.set(newValue)
  }

  toggleFileExplorer() {
    this.toggleElement('file-explorer');
  }

  toggleSearch() {
    this.toggleElement('search');
  }

  toggleSourceControl() {
    this.toggleElement('source-control');
  }

  toggleRunAndDebug() {
    this.toggleElement('run-and-debug');
  }

  toggleExtensions() {
    this.toggleElement('extensions');
  }

  toggleSearchFolders() {
    this.toggleElement('search-folders');
  }

  toggleSearchFiles() {
    this.toggleElement('search-files');
  }
}
