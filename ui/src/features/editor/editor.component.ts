import { Component, inject, OnInit } from '@angular/core';
import { ContextService } from '../app-context/app-context.service';
import { getElectronApi } from '../../utils';

@Component({
  selector: 'app-editor',
  imports: [],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
})
export class EditorComponent implements OnInit {
  private readonly _context = inject(ContextService);
  isLoading = false;
  error: string | null = null;

  ngOnInit(): void {
    this.init();
  }

  /**
   * Sets inital state forf editor and app ctx
   */
  private async init() {
    this.isLoading = true;
    this.error = null;

    let api = getElectronApi();
    let ctx = this._context.getContext();
    let exists = await api.exists(undefined, ctx.directoryFolder);

    if (!exists) {
      this.error = 'Selected directory dose not exist';
      this.isLoading = false;
      return;
    }

    ctx.section = 'editor';
    this._context.setContext(ctx);

    this.isLoading = false;
  }
}
