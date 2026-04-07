import {
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
  Signal,
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { EditorStateService } from "../core/state/editor-state.service";
import { fileNode } from "../../../gen/type";
import { MatTooltipModule } from "@angular/material/tooltip";
import { EditorDocumentOpenerService } from "../core/services/editor-document-opener.service";
import { ApplicationConfirmationService } from "../../../shared/services/application-confirmation.service";
import { EditorDocumentStateService } from "../core/lsp/editor-document-state.service";
import { EditorSessionStateService } from "../core/services/editor-session-state.service";
import { EditorDocumentDiagnosticService } from "../core/lsp/editor-document-diagnostic.service";
import { useEffect } from "../../../lib/useEffect";
import { Diagnostic } from "vscode-languageserver-protocol";
import { EditorLanguageServerProtocolService } from "../core/lsp/editor-language-server-protocol.service";
import { EditorDocumentLanguageIdService } from "../core/lsp/editor-document-language-id.service";
import { EditorDocumentOpenTrackerService } from "../core/lsp/editor-document-open-tracker.service";
import { EditorOpenFilesService } from "../editor-open-files/services/editor-open-files.service";
import { EditorWorkspaceService } from "../core/workspace/editor-workspace.service";

@Component({
  selector: "app-editor-open-file-item",
  imports: [MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: "./editor-open-file-item.component.html",
  styleUrl: "./editor-open-file-item.component.css",
})
export class EditorOpenFileItemComponent implements OnInit {
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorDocumentOpenerService = inject(
    EditorDocumentOpenerService,
  );
  private readonly applicationConfirmationService = inject(
    ApplicationConfirmationService,
  );
  private readonly editorDocumentStateService = inject(
    EditorDocumentStateService,
  );
  private readonly editorSessionStateService = inject(
    EditorSessionStateService,
  );
  private readonly editorDocumentDiagnosticService = inject(
    EditorDocumentDiagnosticService,
  );
  private readonly editorLanguageServerProtocolService = inject(
    EditorLanguageServerProtocolService,
  );
  private readonly editorDocumentLanguageIdService = inject(
    EditorDocumentLanguageIdService,
  );
  private readonly editorDocumentOpenTrackerService = inject(
    EditorDocumentOpenTrackerService,
  );
  private readonly editorOpenFilesService = inject(EditorOpenFilesService);
  private readonly editorWorkspaceService = inject(EditorWorkspaceService);

  /**
   * Displays count of error diagnostic it has for file
   * @param diagnostics List of diagnostics
   */
  private displayDocumentDiagnostics = (diagnostics: Diagnostic[]) => {
    this.errorDiagnosticCount.set(diagnostics.length);
  };

  constructor() {
    useEffect(() => {
      this.displayDocumentDiagnostics(
        this.editorDocumentDiagnosticService.getDiagnostics(
          this.fileNode().path,
        ),
      );
    }, [this.editorDocumentDiagnosticService.valueChanged]);

    useEffect(() => {
      this.isDirty.set(
        this.editorDocumentStateService.isDirty(this.fileNode().path),
      );
    }, [this.editorDocumentStateService.dirtyChanged]);
  }

  ngOnInit() {
    this.openFileTooltip.set(this.fileNode().path);
  }

  /**
   * Input file node to render for the given item
   */
  public fileNode = input.required<fileNode>();

  /**
   * Holds the tooltip for hover information
   */
  public openFileTooltip = signal("");

  /**
   * How long it takes for the parent tooltip to show
   */
  public tooltTipDelayInMs = 750;

  /**
   * Keeps track if the current file is dirty
   */
  public readonly isDirty = signal(false);

  /**
   * Keep track selected directory
   */
  private readonly workspaceFolder = this.editorWorkspaceService.workspace;

  /**
   * Keep track if the given file tab is the one open / active
   */
  public isActive: Signal<boolean> = computed(
    () => this.editorWorkspaceService.document()?.path === this.fileNode().path,
  );

  /**
   * Holds how many error diagnostics this document has
   */
  public readonly errorDiagnosticCount = signal(0);

  /**
   * The icon name displayed for the given file based on it's extension computed once
   */
  public fileIcon: Signal<string> = computed(() => {
    return (
      this.fileIconListMapNames.find(
        (x) => x.fileExtension == this.fileNode().extension,
      )?.iconName ?? "description"
    );
  });

  private fileIconListMapNames: { fileExtension: string; iconName: string }[] =
    [
      {
        fileExtension: ".html",
        iconName: "html",
      },
      {
        fileExtension: ".css",
        iconName: "css",
      },
      {
        fileExtension: ".js",
        iconName: "javascript",
      },
    ];

  /**
   * Removes the given tab item from the open files and put's the next aviavke item as active
   */
  public async closeFileTabItem(event: Event) {
    event.stopPropagation();

    if (this.isDirty()) {
      const confirmed = await this.applicationConfirmationService.request(
        "This file has unsaved changes are you sure you want to close it",
      );
      if (!confirmed) {
        return;
      }
    }

    const workspaceFolder = this.workspaceFolder();
    if (!workspaceFolder) {
      console.error("Could not get workspace folder to close document");
      return;
    }

    this.editorDocumentStateService.reset(this.fileNode().path);
    this.editorSessionStateService.removeCache(this.fileNode().path);
    this.editorDocumentOpenTrackerService.close(this.fileNode().path);

    const languageId = this.editorDocumentLanguageIdService.getLanguageId(
      this.fileNode().path,
    );
    if (languageId) {
      this.editorLanguageServerProtocolService.didCloseTextDocument(
        workspaceFolder,
        languageId,
        this.fileNode().path,
      );
      console.log("Send text document closed");
    }

    this.editorOpenFilesService.close(this.fileNode());
    const nodes = this.editorOpenFilesService.nodes();

    if (this.isActive()) {
      let nextAvNode: fileNode | null = nodes[0];
      if (nextAvNode) {
        this.editorDocumentOpenerService.openFileNodeInEditor(nextAvNode);
      }
    }
  }

  /**
   * Selects the given tab item node as the new active
   */
  public selectFileTabItem(event: Event) {
    this.editorDocumentOpenerService.openFileNodeInEditor(this.fileNode());
  }
}
