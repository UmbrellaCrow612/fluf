import { AfterViewInit, Component, inject } from '@angular/core';
import { EditorFrameComponent } from '../editor-frame/editor-frame.component';
import { EditorMainContentComponent } from '../editor-main-content/editor-main-content.component';
import { EditorFooterComponent } from '../editor-footer/editor-footer.component';
import { EditorKeyBindingService } from '../editor-key-bindings/editor-key-binding.service';
import { EditorContextSateValidationService } from '../core/services/editor-context-sate-validation.service';

/**
 * Main entry point component rendered for the editor
 */
@Component({
  selector: 'app-editor-main',
  imports: [
    EditorFrameComponent,
    EditorMainContentComponent,
    EditorFooterComponent,
  ],
  templateUrl: './editor-main.component.html',
  styleUrl: './editor-main.component.css',
})
export class EditorMainComponent implements AfterViewInit {
  private readonly editorKeyBindingService = inject(EditorKeyBindingService);
  private readonly editorContextSateValidationService = inject(
    EditorContextSateValidationService,
  );

  async ngAfterViewInit() {
    await this.editorKeyBindingService.initKeyBindings();
    await this.editorContextSateValidationService.EnsureStateIsValid();
  }
}
