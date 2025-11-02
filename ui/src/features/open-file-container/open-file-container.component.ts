import {
  afterNextRender,
  AfterViewInit,
  Component,
  DestroyRef,
  inject,
  Injector,
  OnInit,
} from '@angular/core';
import { OpenFileContainerTabsComponent } from './open-file-container-tabs/open-file-container-tabs.component';
import { OpenFileEditorComponent } from './open-file-editor/open-file-editor.component';
import { ContextService } from '../app-context/app-context.service';
import { OpenFileContainerBottomComponent } from './open-file-container-bottom/open-file-container-bottom.component';
import { HotKey, HotKeyService } from '../hotkeys/hot-key.service';
import ResizerTwo from 'umbr-resizer-two';

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
export class OpenFileContainerComponent implements OnInit, AfterViewInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hotKeyService = inject(HotKeyService);
  private readonly injector = inject(Injector);

  private resizer = new ResizerTwo({
    direction: 'vertical',
    minFlex: 0.2,
    handleStyles: {
      width: '6px',
      background: 'linear-gradient(to bottom,rgb(19, 18, 18),rgb(20, 20, 20))',
      boxShadow: 'inset 0 0 2px #000, 0 0 4px rgba(0,0,0,0.4)',
    },
  });

  openBottomHotKey: HotKey = {
    callback: (ctx) => {
      if (!ctx.displayFileEditorBottom) {
        this.appContext.update('displayFileEditorBottom', true);
        this.fileEditorContainerFlex = 1;
        this.bottomFlex = 1;
      } else {
        this.appContext.update('displayFileEditorBottom', false);
        this.fileEditorContainerFlex = 1;
        this.bottomFlex = 1;
      }
    },
    keys: ['Control', 'j'],
  };

  showTabBar = false;
  showBottom = false;

  fileEditorContainerFlex = 1;
  bottomFlex = 1;
  minFlex = 0.4;

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

        afterNextRender(
          () => {
            this.updateResizer();
          },
          { injector: this.injector }
        );
      },
      this.destroyRef
    );
  }

  ngAfterViewInit(): void {
    this.updateResizer();
  }

  private updateResizer(): void {
    const target = document.getElementById(
      'open_file_container_resize_wrapper'
    );

    if (!target) {
      console.error('Could not find editor_resize_container');
      return;
    }

    if (this.showBottom) {
      this.resizer.add(target);
    } else {
      this.resizer.remove();
    }
  }

  async ngOnDestroy() {
    this.resizer.remove();
  }
}
