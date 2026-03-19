import { Component, computed, inject, signal, Signal } from '@angular/core';
import { EditorStateService } from '../editor-state/editor-state.service';
import { fileNode } from '../../../gen/type';
import { useEffect } from '../../../lib/useEffect';
import { EditorImageService } from '../core/services/editor-image.service.service';
import { LocalFileUrlService } from '../core/services/editor-local-file-url.service';
import { getElectronApi } from '../../../utils';

/**
 * Displays a image viwer for the current open file and render any specific component needed to render it
 */
@Component({
  selector: 'app-editor-image-pane',
  imports: [],
  templateUrl: './editor-image-pane.component.html',
  styleUrl: './editor-image-pane.component.css',
})
export class EditorImagePaneComponent {
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorImageService = inject(EditorImageService);
  private readonly localFileUrlService = inject(LocalFileUrlService);
  private readonly electronApi = getElectronApi();

  /**
   * Keeps track of the current active file node in the editor
   */
  public readonly activeFileNode: Signal<fileNode | null> = computed(() =>
    this.editorStateService.currentOpenFileInEditor(),
  );

  /**
   * Holds loading state
   */
  public readonly isLoading = signal(false);

  /**
   * Holds error state
   */
  public readonly error = signal<string | null>(null);

  /**
   * Holds the file URL to the image to render
   */
  public readonly imageSrc = signal('');

  constructor() {
    useEffect(
      async (_, fileNode) => {
        if (!fileNode) {
          this.error.set(`No open file in editor cannot show image pane`);
          return;
        }

        await this.showImagePane(fileNode);
      },
      [this.activeFileNode],
    );
  }

  /**
   * Renders the needed component or UI to display the image pane for the given file
   * @param node The node to render in the UI
   */
  private showImagePane = async (node: fileNode): Promise<void> => {
    this.error.set(null);
    this.isLoading.set(true);

    try {
      if (!this.editorImageService.isSupportedExtension(node.extension)) {
        throw new Error(
          `File type not supported supported are ${JSON.stringify(this.editorImageService.supportedImageExtensions)}`,
        );
      }

      const norm = await this.electronApi.pathApi.normalize(node.path);
      const imgSrc = this.localFileUrlService.toUrl(norm);
      this.imageSrc.set(imgSrc);
    } catch (error: any) {
      console.error('Failed to render image pane ', error);
      this.error.set(`Failed to render image pane ${error?.message}`);
    } finally {
      this.isLoading.set(false);
    }
  };
}
