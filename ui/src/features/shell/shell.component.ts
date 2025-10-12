import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { SideBarRenderComponent } from '../side-bar-render/side-bar-render.component';
import { OpenFileContainerComponent } from '../open-file-container/open-file-container.component';
import {
  ContextService,
  UnsubscribeFn,
} from '../app-context/app-context.service';

@Component({
  selector: 'app-shell',
  imports: [
    TopBarComponent,
    SideBarComponent,
    SideBarRenderComponent,
    OpenFileContainerComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit, OnDestroy {
  private readonly _appCtx = inject(ContextService);

  isSideBarRenderActive = false;
  private unSub: UnsubscribeFn | null = null;

  ngOnInit(): void {
    this.unSub = this._appCtx.sub('side-bar-active-element', (ctx) => {
      if (ctx.sideBarActiveElement) {
        this.isSideBarRenderActive = true;
      } else {
        this.isSideBarRenderActive = false;
      }
    });
  }
  ngOnDestroy(): void {
    if (this.unSub) {
      this.unSub();
    }
  }

  resizerMouseDown(event: MouseEvent) {}
}
