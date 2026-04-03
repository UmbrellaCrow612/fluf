import { AfterViewInit, Component, inject } from "@angular/core";
import { EditorFrameComponent } from "../editor-frame/editor-frame.component";
import { EditorMainContentComponent } from "../editor-main-content/editor-main-content.component";
import { EditorFooterComponent } from "../editor-footer/editor-footer.component";
import { EditorKeyBindingService } from "../editor-key-bindings/editor-key-binding.service";
import { EditorTerminalService } from "../editor-terminal/services/editor-terminal.service";
import { EditorSateValidationService } from "../core/state/editor-sate-validation.service";
import { EditorDocumentDraftService } from "../core/lsp/editor-document-draft.service";
import { EditorDocumentStateService } from "../core/lsp/editor-document-state.service";

/**
 * Main entry point component rendered for the editor
 */
@Component({
  selector: "app-editor-main",
  imports: [
    EditorFrameComponent,
    EditorMainContentComponent,
    EditorFooterComponent,
  ],
  templateUrl: "./editor-main.component.html",
  styleUrl: "./editor-main.component.css",
})
export class EditorMainComponent implements AfterViewInit {
  private readonly editorKeyBindingService = inject(EditorKeyBindingService);
  private readonly editorSateValidationService = inject(
    EditorSateValidationService,
  );
  private readonly editorTerminalService = inject(EditorTerminalService);
  private readonly editorDocumentStateService = inject(
    EditorDocumentStateService,
  );

  constructor() {
    this.editorTerminalService.InitiizeBackgroundTerminalBufferListerner();
    this.editorDocumentStateService.setupSaveShortcutHandler();
  }

  async ngAfterViewInit() {
    await this.editorKeyBindingService.initKeyBindings();
    await this.editorSateValidationService.EnsureStateIsValid();
  }
}
