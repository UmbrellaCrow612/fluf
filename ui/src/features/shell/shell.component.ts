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
    SideBarRenderComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit {
  private readonly _appCtx = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Flex value of the editor container
   */
  container_four_flex = 1;
  side_bar_render_flex = 1;

  isResizing = false;

  initResize(event: MouseEvent) {
    event.preventDefault();
    this.isResizing = true;

    const onMouseMove = (event: MouseEvent) => {
      if (!this.isResizing) return;

      const containerThree = document.querySelector(
        '.container_three'
      ) as HTMLElement;
      if (!containerThree) return;

      const rect = containerThree.getBoundingClientRect();
      const mouseXRelative = event.clientX - rect.left; // Correct relative position
      const totalWidth = rect.width;

      let newSidebarFlex = mouseXRelative / totalWidth;
      let newShellFlex = 1 - newSidebarFlex;

      // Clamp flex values
      newSidebarFlex = Math.max(0.2, Math.min(0.8, newSidebarFlex));
      newShellFlex = Math.max(0.2, Math.min(0.8, newShellFlex));

      this.side_bar_render_flex = newSidebarFlex;
      this.container_four_flex = newShellFlex;
    };

    const stopResize = () => {
      this.isResizing = false;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopResize);
    };

    // Listen for mouse move and mouse up on the window
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopResize);
  }

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
