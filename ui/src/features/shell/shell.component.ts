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
    SideBarComponent
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

  sideBarRenderContainerFlex = 1;
  fileOpenContainerFlex = 4;
  pageShellTotalFlex = 5;

  isResizing = false;
  reSizeMouseStartX = 0;

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

  closeSideBar() {
    this._appCtx.update(
      'sideBarActiveElement',
      null,
      'side-bar-active-element'
    );
  }

  resizerMouseDown(event: MouseEvent) {
    event.preventDefault();

    this.isResizing = true;
    this.reSizeMouseStartX = event.clientX;

    document.addEventListener('mousemove', this.rezierMouseMove);
    document.addEventListener('mouseup', this.resizerMouseUp);
  }

  private rezierMouseMove = (event: MouseEvent) => {
    if (!this.isResizing) return;

    const container = document.querySelector('.page_shell') as HTMLElement;
    if (!container) return;

    const totalWidth = container.clientWidth;
    const deltaX = event.clientX - this.reSizeMouseStartX;

    let sidebarWidth =
      (this.sideBarRenderContainerFlex / this.pageShellTotalFlex) * totalWidth;
    let fileWidth =
      (this.fileOpenContainerFlex / this.pageShellTotalFlex) * totalWidth;

    sidebarWidth += deltaX;
    fileWidth -= deltaX;

    const minWidth = 225;
    if (sidebarWidth < minWidth) {
      sidebarWidth = minWidth;
      fileWidth = totalWidth - sidebarWidth;
    } else if (fileWidth < minWidth) {
      fileWidth = minWidth;
      sidebarWidth = totalWidth - fileWidth;
    }

    const totalFlex = sidebarWidth + fileWidth;
    this.sideBarRenderContainerFlex =
      (sidebarWidth / totalFlex) * this.pageShellTotalFlex;
    this.fileOpenContainerFlex =
      (fileWidth / totalFlex) * this.pageShellTotalFlex;

    this.reSizeMouseStartX = event.clientX;
  };

  private resizerMouseUp = () => {
    this.isResizing = false;
    document.removeEventListener('mousemove', this.rezierMouseMove);
    document.removeEventListener('mouseup', this.resizerMouseUp);
  };
}
