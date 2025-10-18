import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { OpenFileContainerTabsComponent } from './open-file-container-tabs/open-file-container-tabs.component';
import { OpenFileEditorComponent } from './open-file-editor/open-file-editor.component';
import { ContextService } from '../app-context/app-context.service';
import { OpenFileContainerBottomComponent } from './open-file-container-bottom/open-file-container-bottom.component';
import { HotKey, HotKeyService } from '../hotkeys/hot-key.service';

@Component({
  selector: 'app-open-file-container',
  imports: [
    OpenFileContainerTabsComponent,
    OpenFileEditorComponent,
    OpenFileContainerBottomComponent,
  ],
  templateUrl: './open-file-container.component.html',
  styleUrl: './open-file-container.component.css',
})
export class OpenFileContainerComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hotKeyService = inject(HotKeyService);

  openBottomHotKey: HotKey = {
    callback: (ctx) => {
      if (!ctx.displayFileEditorBottom) {
        this.appContext.update('displayFileEditorBottom', true);
        this.fileEditorContainerFlex = 1;
        this.bottomFlex = 1
      } else {
        this.appContext.update('displayFileEditorBottom', false);
        this.fileEditorContainerFlex = 1;
        this.bottomFlex = 1
      }
    },
    keys: ['Control', 'j'],
  };

  showTabBar = false;
  showBottom = false;

  fileEditorContainerFlex = 1;
  bottomFlex = 1;
  minFlex = 0.3;

  ngOnInit(): void {
    let init = this.appContext.getSnapshot();

    this.showTabBar =
      init.openFiles && init.openFiles.length > 0 ? true : false;
    this.showBottom = init.displayFileEditorBottom
      ? init.displayFileEditorBottom
      : false;

    this.hotKeyService.autoSub(this.openBottomHotKey, this.destroyRef);

    this.appContext.autoSub(
      'openFiles',
      (ctx) => {
        this.showTabBar =
          ctx.openFiles && ctx.openFiles.length > 0 ? true : false;
      },
      this.destroyRef
    );

    this.appContext.autoSub(
      'displayFileEditorBottom',
      (ctx) => {
        if (typeof ctx.displayFileEditorBottom === 'boolean') {
          this.showBottom = ctx.displayFileEditorBottom;
        } else {
          this.showBottom = false;
        }
      },
      this.destroyRef
    );
  }

  isResizing = false;
  initResize(event: MouseEvent) {
    event.preventDefault();
    this.isResizing = true;

    const container = (event.target as HTMLElement).parentElement;
    if (!container) return;

    const totalHeight = container.offsetHeight;
    const totalFlex = this.fileEditorContainerFlex + this.bottomFlex;

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      const deltaY = mouseMoveEvent.movementY;

      const deltaFlex = (deltaY / totalHeight) * totalFlex;

      let newTopFlex = this.fileEditorContainerFlex + deltaFlex;
      let newBottomFlex = this.bottomFlex - deltaFlex;

      if (newTopFlex < this.minFlex) {
        newTopFlex = this.minFlex;
        newBottomFlex = totalFlex - this.minFlex;
      } else if (newBottomFlex < this.minFlex) {
        newBottomFlex = this.minFlex;
        newTopFlex = totalFlex - this.minFlex;
      }

      this.fileEditorContainerFlex = newTopFlex;
      this.bottomFlex = newBottomFlex;
    };

    const onMouseUp = () => {
      this.isResizing = false;

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
}
