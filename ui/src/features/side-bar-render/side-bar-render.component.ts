import {
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { ContextService } from '../app-context/app-context.service';
import { sideBarActiveElement } from '../app-context/type';
import { FileExplorerComponent } from '../file-explorer/file-explorer.component';

@Component({
  selector: 'app-side-bar-render',
  imports: [FileExplorerComponent],
  templateUrl: './side-bar-render.component.html',
  styleUrl: './side-bar-render.component.css',
})
export class SideBarRenderComponent implements OnInit {
  private readonly _appCtx = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Keeps track of the current side bar active element
   */
  sideBarActiveElement: sideBarActiveElement | null = null;

  ngOnInit(): void {
    let initCtx = this._appCtx.context;
    this.sideBarActiveElement = initCtx.sideBarActiveElement;
    this._appCtx.autoSub(
      'side-bar-active-element',
      (ctx) => {
        this.sideBarActiveElement = ctx.sideBarActiveElement;
      },
      this.destroyRef
    );
  }
}
