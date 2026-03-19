import { Component, computed, inject, signal } from '@angular/core';
import { LocalFileUrlService } from '../core/services/editor-local-file-url.service';
import { EditorContextService } from '../editor-context/editor-context.service';
import { useEffect } from '../../../lib/useEffect';
import { fileNode } from '../../../gen/type';
import { getElectronApi } from '../../../utils';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/**
 * Displays a PDF plugin to show PDF's
 */
@Component({
  selector: 'app-editor-pdf-pane',
  imports: [],
  templateUrl: './editor-pdf-pane.component.html',
  styleUrl: './editor-pdf-pane.component.css',
})
export class EditorPdfPaneComponent {
  private readonly localFileUrlService = inject(LocalFileUrlService);
  private readonly editorContextService = inject(EditorContextService);
  private readonly electronApi = getElectronApi();
  private sanitizer = inject(DomSanitizer);

  /**
   * Keeps track of the current open file in the editor
   */
  public readonly activeFileNode = computed(() =>
    this.editorContextService.currentOpenFileInEditor(),
  );
  /**
   * Holda a refrence to the PDF img src
   */
   public readonly pdfSrcUrl = signal<SafeResourceUrl | string>('');

  /**
   * Holds error state
   */
  public readonly error = signal<string | null>(null);

  /**
   * Holds loading state
   */
  public readonly isLoading = signal(false);

  constructor() {
    useEffect(
      async (_, fileNode) => {
        if (!fileNode) {
          this.error.set(`No current active file cannot render PDF viewer`);
          return;
        }

        this.showPdfPane(fileNode);
      },
      [this.activeFileNode],
    );
  }

  /**
   * Shows the pdf pane
   * @param node The file to show
   */
   private async showPdfPane(node: fileNode) {
    this.error.set(null);
    this.isLoading.set(true);

    try {
      if (node.extension !== '.pdf') {
        throw new Error('File is not a PDF');
      }

      const norm = await this.electronApi.pathApi.normalize(node.path);
      const src = this.localFileUrlService.toUrl(norm);
      
      const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(src);
      this.pdfSrcUrl.set(safeUrl);
    } catch (error) {
      console.error('Failed to load pdf file ', error);
      this.error.set('Failed to load pdf file');
    } finally {
      this.isLoading.set(false);
    }
  }
}
