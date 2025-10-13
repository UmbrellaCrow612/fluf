import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { SideBarRenderComponent } from '../side-bar-render/side-bar-render.component';
import { OpenFileContainerComponent } from '../open-file-container/open-file-container.component';
import { ContextService } from '../app-context/app-context.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-shell',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    TopBarComponent,
    SideBarComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit {
  private readonly _appCtx = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Side bar render active component
   */
  isSideBarRenderActive = false;

  

  ngOnInit(): void {
    this.isSideBarRenderActive = !!this._appCtx.context.sideBarActiveElement;

    this._appCtx.autoSub(
      'side-bar-active-element',
      (ctx) => {
        this.isSideBarRenderActive = !!ctx.sideBarActiveElement;
      },
      this.destroyRef
    );
  }
}
