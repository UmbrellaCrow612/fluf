import {
  Component,
  DestroyRef,
  inject,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { getElectronApi } from '../../utils';
import { ContextService } from '../app-context/app-context.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

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
  private readonly san = inject(DomSanitizer);

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
  imageSrc: SafeUrl | null = null;

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

      // Check it's an image
      const isImage = /\.(png|jpg|jpeg|gif|bmp|webp|svg)$/i.test(node.name);
      if (!isImage) {
        this.error = 'Not an image file';
        return;
      }

      const base64 = await this.api.readImage(undefined, node.path);

      // Convert to data URL
      const ext = node.extension || 'png';
      const dataUrl = `data:image/${ext};base64,${base64}`;

      // Sanitize for Angular
      this.imageSrc = this.san.bypassSecurityTrustUrl(dataUrl);
    } catch (err: any) {
      this.error = err?.message || 'Unknown error';
    } finally {
      this.isLoading = false;
    }
  }
}
