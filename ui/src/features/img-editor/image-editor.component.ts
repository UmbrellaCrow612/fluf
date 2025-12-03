import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { getElectronApi } from '../../utils';
import { ContextService } from '../app-context/app-context.service';
import { hasImageExtension } from './utils';
import { InMemoryContextService } from '../app-context/app-in-memory-context.service';

@Component({
  selector: 'app-image-editor',
  imports: [],
  templateUrl: './image-editor.component.html',
  styleUrl: './image-editor.component.css',
})
export class ImageEditorComponent implements OnInit {
  private readonly api = getElectronApi();
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly inMemoryContextService = inject(InMemoryContextService);

  async ngOnInit() {
    let init = this.appContext.getSnapshot();

    this.currentActiveFileNode = init.currentOpenFileInEditor;

    await this.render();

    this.appContext.autoSub(
      'currentOpenFileInEditor',
      async (ctx) => {
        this.currentActiveFileNode = ctx.currentOpenFileInEditor;
        await this.render();
      },
      this.destroyRef
    );
  }

  currentActiveFileNode: fileNode | null = null;
  isLoading = false;
  error: string | null = null;
  imageSrc: string | null = null;
  base64: string | undefined = undefined;

  /**
   * Runs to render the current active img
   */
  private async render() {
    this.isLoading = true;
    this.error = null;

    try {
      const node = this.currentActiveFileNode;
      if (!node) {
        this.error = 'No file selected';
        return;
      }

      const isImage = hasImageExtension(node.path);
      if (!isImage) {
        this.error = 'Not an image file';
        return;
      }

      this.base64 = await this.api.readImage(undefined, node.path);
      if (!this.base64) {
        this.error = 'Failed to read image';
        return;
      }

      const ext = node.extension || 'png';
      this.imageSrc = `data:image/${ext};base64,${this.base64}`;
    } catch (err: any) {
      this.error = err?.message || 'Unknown error';
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Runs when the user right clicks the img tag
   */
  onRightClick(event: MouseEvent) {
    event.preventDefault();

    this.inMemoryContextService.update('currentActiveContextMenu', {
      data: this.base64 ?? null,
      key: 'image-editor-img-context-menu',
      pos: {
        mouseX: event.clientX,
        mouseY: event.clientY,
      },
    });
  }
}
