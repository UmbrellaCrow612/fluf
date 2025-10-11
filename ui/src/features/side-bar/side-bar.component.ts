import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ContextService } from '../app-context/app-context.service';
import { Subscription } from 'rxjs';
import { sideBarActiveElement } from '../app-context/type';

@Component({
  selector: 'app-side-bar',
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './side-bar.component.html',
  styleUrl: './side-bar.component.css',
})
export class SideBarComponent implements OnInit, OnDestroy {
  private readonly _appCtx = inject(ContextService);

  private _activeElementSub: Subscription | null = null;
  /**
   * Keeps track of the current active side bar element
   */
  activeElement: sideBarActiveElement | null = null;

  ngOnInit(): void {
    this._activeElementSub =
      this._appCtx.instace.sideBarActiveElement$.subscribe((activeElement) => {
        this.activeElement = activeElement;
      });
  }

  ngOnDestroy(): void {
    this._activeElementSub?.unsubscribe();
  }

  toggleFileExplorer() {
    this._appCtx.instace.setSideBarActiveElement('file-explorer');
  }

  toggleSearch() {
    this._appCtx.instace.setSideBarActiveElement('search');
  }

  toggleSourceControl() {
    this._appCtx.instace.setSideBarActiveElement('source-control');
  }

  toggleRunAndDebug() {
    this._appCtx.instace.setSideBarActiveElement('run-and-debug');
  }

  toggleExteions() {
    this._appCtx.instace.setSideBarActiveElement('extensions');
  }
}
