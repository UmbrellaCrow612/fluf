import {
  Component,
  DestroyRef,
  inject,
  input,
  model,
  OnInit,
  output,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { getElectronApi } from '../../../utils';
import { ContextService } from '../../app-context/app-context.service';

@Component({
  selector: 'app-explorer-item',
  imports: [MatIconModule],
  templateUrl: './explorer-item.component.html',
  styleUrl: './explorer-item.component.css',
})
export class ExplorerItemComponent implements OnInit {
  private readonly _api = getElectronApi();
  private readonly _appCtx = inject(ContextService);
  private readonly _destroyRef = inject(DestroyRef);

  isOpenInFileEditorView = false;

  node = model.required<fileNode>();
  depth = input.required<number>();

  ngOnInit(): void {
    this.isOpenInFileEditorView =
      this._appCtx.context.activeFileOpen?.path === this.node().path;

    this._appCtx.autoSub(
      'active-open-file',
      (ctx) => {
        if (ctx.activeFileOpen?.path == this.node().path) {
          this.isOpenInFileEditorView = true;
        } else {
          this.isOpenInFileEditorView = false;
        }
      },
      this._destroyRef
    );
  }

  async itemClicked(event: Event) {
    event.preventDefault();
    if (this.node().isDirectory && !this.node().expanded) {
      let nodes = await this._api.readDir(undefined, this.node().path);
      this.node().children = nodes;
      this.node().expanded = true;

      this._appCtx.update(
        'fileExplorerOpenedNodes',
        this._appCtx.context.fileExplorerOpenedNodes,
        'file-explorer-opene-nodes'
      );
    } else {
      this.node().expanded = false;

      this._appCtx.update(
        'fileExplorerOpenedNodes',
        this._appCtx.context.fileExplorerOpenedNodes,
        'file-explorer-opene-nodes'
      );

      if (!this.node().isDirectory) {
        this._appCtx.update('activeFileOpen', this.node(), 'active-open-file');
      }
    }
  }
}
