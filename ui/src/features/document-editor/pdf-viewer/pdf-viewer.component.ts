import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ContextService } from '../../app-context/app-context.service';
import { PdfService } from './pdf.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser'; 

@Component({
  selector: 'app-pdf-viewer',
 
  imports: [], 
  templateUrl: './pdf-viewer.component.html',
  styleUrl: './pdf-viewer.component.css',
})
export class PdfViewerComponent implements OnInit {
 private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pdfService = inject(PdfService);
  
  private readonly sanitizer = inject(DomSanitizer);

  currentFileNode: fileNode | null = null;
  isLoading = false;
  error: string | null = null;
  
  sanitizedObjectUrl: SafeResourceUrl | null = null; 

  async ngOnInit() {
    let init = this.appContext.getSnapshot();

    this.currentFileNode = init.currentOpenFileInEditor;
    
    this.appContext.autoSub(
      'currentOpenFileInEditor',
      async (ctx) => {
        this.currentFileNode = ctx.currentOpenFileInEditor;
        await this.render();
      },
      this.destroyRef
    );

    await this.render();
  }

  /**
   * Renders the PDF whenever node changes
   */
  private async render() {
    this.isLoading = true;
    this.error = null;

    try {
      this.sanitizedObjectUrl = null; 

      if (!this.currentFileNode) {
        this.error = 'No file selected';
        return;
      }

      const pdfUrlString = this.pdfService.getLocalPdfUrl(this.currentFileNode.path);
      
      this.sanitizedObjectUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfUrlString);
    } catch (error: any) {
      this.error = error?.message || 'An unknown error occurred while rendering the PDF.';
    } finally {
      this.isLoading = false;
    }
  }
}