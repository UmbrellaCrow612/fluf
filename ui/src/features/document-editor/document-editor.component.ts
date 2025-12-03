import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ContextService } from '../app-context/app-context.service';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-document-editor',
  imports: [],
  templateUrl: './document-editor.component.html',
  styleUrl: './document-editor.component.css',
})
export class DocumentEditorComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private sanitizer = inject(DomSanitizer);

  private selectedFileNode: fileNode | null = null;
  error: string | null = null;
  isLoading = false;
  pdfBlobUrl: any;

  async ngOnInit() {
    let init = this.appContext.getSnapshot();
    this.selectedFileNode = init.currentOpenFileInEditor;

    // Initial render is performed below, but the subscription will handle updates
    this.appContext.autoSub(
      'currentOpenFileInEditor',
      async (ctx) => {
        this.selectedFileNode = ctx.currentOpenFileInEditor;
        // Only trigger render if a file is actually selected or changed
        if (this.selectedFileNode) {
          await this.render();
        }
      },
      this.destroyRef
    );

    await this.render();
  }

  /**
   * Fetches the PDF content using the custom protocol and displays it via a Blob URL.
   */
  private async render() {
    this.isLoading = true;
    this.error = null;
    this.pdfBlobUrl = null;

    try {
      let absolutePath = this.selectedFileNode?.path ?? '';
      absolutePath = absolutePath.replace(/\\/g, '/');
      const pdfUrl = `pdf://${absolutePath}`;

      const response = await fetch(pdfUrl);

      if (!response.ok) {
        throw new Error(`Failed to load PDF: ${response.status}`);
      }

      const blob = await response.blob();
      const unsafeUrl = URL.createObjectURL(blob);

      this.pdfBlobUrl =
        this.sanitizer.bypassSecurityTrustResourceUrl(unsafeUrl);
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.isLoading = false;
    }
  }
}
