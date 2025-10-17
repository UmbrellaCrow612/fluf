import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ContextService } from '../../app-context/app-context.service';
import { getElectronApi } from '../../../utils';

@Component({
  selector: 'app-open-file-editor',
  imports: [],
  templateUrl: './open-file-editor.component.html',
  styleUrl: './open-file-editor.component.css',
})
export class OpenFileEditorComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = getElectronApi();

  /**
   * The current file to show in the editor
   */
  openFileNode: fileNode | null = null;
  error: string | null = null;
  isLoading = false;

  stringContent = '';

  async ngOnInit() {
    this.openFileNode = this.appContext.getSnapshot().currentOpenFileInEditor;
    if (this.openFileNode) {
      await this.displayFile();
    }

    this.appContext.autoSub(
      'currentOpenFileInEditor',
      async (ctx) => {
        this.openFileNode = ctx.currentOpenFileInEditor;
        if (this.openFileNode) {
          await this.displayFile();
        }
      },
      this.destroyRef
    );
  }

  private async displayFile() {
    this.error = null;
    this.isLoading = true;

    if (!this.openFileNode) {
      this.error = `Could not read file`;
      this.isLoading = false;
      return;
    }

    this.stringContent = await this.api.readFile(
      undefined,
      this.openFileNode?.path
    );

    this.isLoading = false;
  }
}
