import { Component, DestroyRef, inject, OnInit, Type } from '@angular/core';
import { ContextService } from '../app-context/app-context.service';
import { DocumentNotSupportedComponent } from './document-not-supported/document-not-supported.component';
import { NgComponentOutlet } from '@angular/common';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';

/**
 * Renders when a supportted document type is chosen as a file then this renders the specific component needed to view said document type
 */
@Component({
  selector: 'app-document-editor',
  imports: [NgComponentOutlet],
  templateUrl: './document-editor.component.html',
  styleUrl: './document-editor.component.css',
})
export class DocumentEditorComponent implements OnInit {
  private readonly appContext = inject(ContextService);
  private readonly destroyRef = inject(DestroyRef);

  private currentNode: fileNode | null = null;

  documentComponents: {
    /**
     * Component to render
     */
    component: Type<any>;

    /**
     * Condition to render said component
     */
    condition: () => boolean;
  }[] = [
    {
      component: PdfViewerComponent,
      condition: () => {
        return this.currentNode?.extension == 'pdf';
      },
    },
  ];

  /**
   * Gets the specific document component to render
   */
  get renderComponent(): Type<any> {
    return (
      this.documentComponents.find((x) => x.condition())?.component ??
      DocumentNotSupportedComponent
    );
  }

  async ngOnInit() {
    let init = this.appContext.getSnapshot();

    this.currentNode = init.currentOpenFileInEditor;

    this.appContext.autoSub(
      'currentOpenFileInEditor',
      (ctx) => {
        this.currentNode = ctx.currentOpenFileInEditor;
      },
      this.destroyRef
    );
  }
}
