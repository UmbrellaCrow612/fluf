import { sideBarActiveElement } from './../app-context/type';
import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { SideBarComponent } from '../side-bar/side-bar.component';
import { ContextService } from '../app-context/app-context.service';
import { FileExplorerComponent } from '../file-explorer/file-explorer.component';
import { FileExplorerContextMenuComponent } from '../file-explorer/file-explorer-context-menu/file-explorer-context-menu.component';
import { OpenFileContainerComponent } from '../open-file-container/open-file-container.component';
import { getElectronApi } from '../../utils';

type unSub = () => Promise<void>;

@Component({
  selector: 'app-editor',
  imports: [
    TopBarComponent,
    SideBarComponent,
    FileExplorerComponent,
    FileExplorerContextMenuComponent,
    OpenFileContainerComponent,
  ],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
})
export class EditorComponent implements OnInit, OnDestroy {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = getElectronApi();

  private isDirectoryBeingWatched = false;
  private unSub: unSub | null = null;

  leftFlex = 1;
  rightFlex = 1;
  isResizing = false;
  initResizer(event: MouseEvent) {
    event.preventDefault();
    this.isResizing = true;
    let previousX = event.clientX;
    const container = document.getElementById('resizer_container')!;

    const MIN_FLEX = 0.4;
    const sensitivity = (1 / container?.clientWidth) * 2;

    const mouseMove = (mouseMove: MouseEvent) => {
      if (!this.isResizing) return;
      this.appContext.update('isEditorResize', true);

      const currentX = mouseMove.clientX;
      const deltaX = currentX - previousX;

      const total = this.leftFlex + this.rightFlex;

      if (deltaX > 0) {
        // moved right -> shrink RIGHT, grow LEFT
        const change = deltaX * sensitivity;
        this.rightFlex = Math.max(MIN_FLEX, this.rightFlex - change);
        this.leftFlex = Math.max(MIN_FLEX, this.leftFlex + change);
      } else if (deltaX < 0) {
        // moved left -> shrink LEFT, grow RIGHT
        const change = Math.abs(deltaX) * sensitivity;
        this.leftFlex = Math.max(MIN_FLEX, this.leftFlex - change);
        this.rightFlex = Math.max(MIN_FLEX, this.rightFlex + change);
      }

      // Re-normalise so leftFlex + rightFlex === total (keeps overall ratio consistent)
      const currentTotal = this.leftFlex + this.rightFlex;
      if (currentTotal !== 0) {
        this.leftFlex = (this.leftFlex / currentTotal) * total;
        this.rightFlex = (this.rightFlex / currentTotal) * total;
      }

      previousX = currentX;
    };

    const mouseUp = () => {
      this.isResizing = false;
      document.removeEventListener('mousemove', mouseMove);
      document.removeEventListener('mouseup', mouseUp);
    };

    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup', mouseUp);
  }

  isLeftActive = false;
  sideBarActivateElement: sideBarActiveElement = null;

  isFileExplorerContextMenuActive: boolean | null = null;

  async ngOnInit() {
    let init = this.appContext.getSnapshot();

    // set stored state
    this.isLeftActive = init.sideBarActiveElement != null;
    this.sideBarActivateElement = init.sideBarActiveElement;

    // if dir selected watch it
    if (init.selectedDirectoryPath) {
      this.isDirectoryBeingWatched = true;
      this.unSub = await this.api.onDirectoryChange(
        init.selectedDirectoryPath,
        (_) => {
          this.appContext.update('refreshDirectory', true);
        }
      );
    }

    // subs
    this.appContext.autoSub(
      'sideBarActiveElement',
      (ctx) => {
        this.isLeftActive = ctx.sideBarActiveElement != null;
        this.sideBarActivateElement = ctx.sideBarActiveElement;
      },
      this.destroyRef
    );
    this.appContext.autoSub(
      'displayFileExplorerContextMenu',
      (ctx) => {
        this.isFileExplorerContextMenuActive =
          ctx.displayFileExplorerContextMenu;
      },
      this.destroyRef
    );
    this.appContext.autoSub(
      'selectedDirectoryPath',
      async (ctx) => {
        if (!this.isDirectoryBeingWatched && ctx.selectedDirectoryPath) {
          this.isDirectoryBeingWatched = true;
          this.unSub = await this.api.onDirectoryChange(
            ctx.selectedDirectoryPath,
            (_) => {
              this.appContext.update('refreshDirectory', true);
            }
          );
        }
      },
      this.destroyRef
    );
  }

  async ngOnDestroy() {
    if (this.unSub) {
      await this.unSub();
    }
  }
}
