import { Component, computed, inject, signal, Signal } from '@angular/core';
import { EditorContextService } from '../editor-context/editor-context.service';
import { fileNode } from '../../../gen/type';
import { useEffect } from '../../../lib/useEffect';
import { EditorImageService } from '../core/services/editor-image.service.service';
import { EditorSystemFileService } from '../core/services/editor-system-file.service';
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
  private readonly editorContextService = inject(EditorContextService);
  private readonly editorImageService = inject(EditorImageService);
  private readonly editorSystemFileService = inject(EditorSystemFileService);
  private readonly electronApi = getElectronApi();

  /**
   * Keeps track of the current active file node in the editor
   */
  public readonly activeFileNode: Signal<fileNode | null> = computed(() =>
    this.editorContextService.currentOpenFileInEditor(),
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
      const imgSrc = this.editorSystemFileService.get(norm);
      this.imageSrc.set(imgSrc);
    } catch (error: any) {
      console.error('Failed to render image pane ', error);
      this.error.set(`Failed to render image pane ${error?.message}`);
    } finally {
      this.isLoading.set(false);
    }
  };
}
