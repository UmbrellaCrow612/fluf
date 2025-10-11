import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  ContextService,
  UnsubscribeFn,
} from '../app-context/app-context.service';
import { sideBarActiveElement } from '../app-context/type';

@Component({
  selector: 'app-side-bar',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css',
})
export class SideBarComponent implements OnInit, OnDestroy {
  private readonly _appCtx = inject(ContextService);

  /**
   * Keeps track of the current active side bar element
   */
  activeElement: sideBarActiveElement | null = null;
  private unSub: UnsubscribeFn | null = null;

  ngOnInit(): void {
    this.unSub = this._appCtx.sub('side-bar-active-element', (ctx) => {
      this.activeElement = ctx.sideBarActiveElement;
    });
  }

  ngOnDestroy(): void {
    if (this.unSub) {
      this.unSub();
    }
  }

  /** Generic toggle handler to avoid repetition */
  private toggleElement(element: sideBarActiveElement) {
    const newValue = this.activeElement === element ? null : element;

    this._appCtx.update(
      'sideBarActiveElement',
      newValue,
      'side-bar-active-element'
    );
  }

  // --- Convenience wrappers for each sidebar button ---
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
}
