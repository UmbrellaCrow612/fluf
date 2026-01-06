import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  Signal,
  Type,
} from '@angular/core';
import { ContextService } from '../app-context/app-context.service';
import { DocumentNotSupportedComponent } from './document-not-supported/document-not-supported.component';
import { NgComponentOutlet } from '@angular/common';
import { PdfViewerComponent } from './pdf-viewer/pdf-viewer.component';
import { Renderable } from '../ngComponentOutlet/type';

/**
 * Renders when a supportted document type is chosen as a file then this renders the specific component needed to view said document type
 */
@Component({
  selector: 'app-document-editor',
  imports: [NgComponentOutlet],
  templateUrl: './document-editor.component.html',
  styleUrl: './document-editor.component.css',
})
export class DocumentEditorComponent {
  private readonly appContext = inject(ContextService);

  private currentNode = computed(() =>
    this.appContext.currentOpenFileInEditor(),
  );

  documentComponents: Renderable[] = [
    {
      component: PdfViewerComponent,
      condition: computed(() => {
        return this.currentNode()?.extension === '.pdf';
      }),
    },
  ];

  renderComponent: Signal<Type<any>> = computed(() => {
    return (
      this.documentComponents.find((x) => x.condition())?.component ??
      DocumentNotSupportedComponent
    );
  });
}
