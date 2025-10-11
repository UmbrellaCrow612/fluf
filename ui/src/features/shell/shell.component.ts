import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { SideBarRenderComponent } from '../side-bar-render/side-bar-render.component';
import { OpenFileContainerComponent } from '../open-file-container/open-file-container.component';
import { Subscription } from 'rxjs';
import { ContextService } from '../app-context/app-context.service';

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

  /**
   * Keeps track if a user clicked a side bar element and made it active the render compo will then render the 
   * specific compo they want
   */
  isSideBarRenderActive = true;
  private isSideBarRenderActiveSub: Subscription | null = null;

  ngOnInit(): void {
    this.isSideBarRenderActiveSub =
      this._appCtx.instace.sideBarActiveElement$.subscribe((el) => {
        if (el) {
          this.isSideBarRenderActive = true; // a side bar element was clicked and now is active
        } else {
          this.isSideBarRenderActive = false; // no side bar element was clicked
        }
      });
  }
  ngOnDestroy(): void {
    this.isSideBarRenderActiveSub?.unsubscribe();
  }
}
