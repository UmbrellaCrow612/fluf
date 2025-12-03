import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ContextService } from '../app-context/app-context.service';
import { hasDocumentExtension } from './utils';

@Component({
  selector: 'app-document-editor',
  imports: [],
  templateUrl: './document-editor.component.html',
  styleUrl: './document-editor.component.css',
})
export class DocumentEditorComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);

  private selectedFileNode: fileNode | null = null;
  error: string | null = null;
  isLoading = false;

  ngOnInit(): void {
    let init = this.appContext.getSnapshot();

    this.selectedFileNode = init.currentOpenFileInEditor;

    this.render();

    this.appContext.autoSub(
      'currentOpenFileInEditor',
      (ctx) => {
        this.selectedFileNode = ctx.currentOpenFileInEditor;
        this.render();
      },
      this.destroyRef
    );
  }

  /**
   * Renders the document in iframe UI
   */
  private render() {
    this.isLoading = true;
    this.error = null;

    try {
      if (!this.selectedFileNode) {
        this.error = 'No file';
        return;
      }

      if (!hasDocumentExtension(this.selectedFileNode.extension)) {
        this.error = 'File is not a document such as pdf, doc etc';
        return;
      }

      // render it
    } catch (error: any) {
      this.error = error?.message;
    } finally {
      this.isLoading = false;
    }
  }
}
