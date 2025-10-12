import { UnsubscribeFn } from './../app-context/app-context.service';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { ContextService } from '../app-context/app-context.service';
import { sideBarActiveElement } from '../app-context/type';
import { FileExplorerComponent } from '../file-explorer/file-explorer.component';

@Component({
  selector: 'app-side-bar-render',
  imports: [FileExplorerComponent],
  templateUrl: './side-bar-render.component.html',
  styleUrl: './side-bar-render.component.css',
})
export class SideBarRenderComponent implements OnInit, OnDestroy {
  private readonly _appCtx = inject(ContextService);
  private unSub: UnsubscribeFn | null = null;

  /**
   * Keeps track of the current side bar active element
   */
  sideBarActiveElement: sideBarActiveElement | null = null;

  ngOnInit(): void {
    let initCtx = this._appCtx.context;
    this.sideBarActiveElement = initCtx.sideBarActiveElement;
    this.unSub = this._appCtx.sub('side-bar-active-element', (ctx) => {
      this.sideBarActiveElement = ctx.sideBarActiveElement;
    });
  }
  ngOnDestroy(): void {
    if (this.unSub) {
      this.unSub();
    }
  }
}
