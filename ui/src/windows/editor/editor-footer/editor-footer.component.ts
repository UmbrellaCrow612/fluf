import { Component, computed, inject, Signal, signal } from "@angular/core";
import { getElectronApi } from "../../../shared/electron";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { DatePipe } from "@angular/common";
import { EditorDocumentDiagnosticService } from "../core/lsp/editor-document-diagnostic.service";
import { EditorWorkspaceService } from "../core/workspace/editor-workspace.service";
import { useEffect } from "../../../lib/useEffect";
import { EditorGitService } from "../core/git/editor-git.service";
import { EditorDocumentStateService } from "../core/lsp/editor-document-state.service";

@Component({
  selector: "app-editor-footer",
  imports: [MatIconModule, MatTooltipModule, DatePipe],
  templateUrl: "./editor-footer.component.html",
  styleUrl: "./editor-footer.component.css",
})
export class EditorFooterComponent {
  private readonly electronApi = getElectronApi();
  private readonly editorDocumentDiagnosticService = inject(
    EditorDocumentDiagnosticService,
  );
  private readonly editorWorkspaceService = inject(EditorWorkspaceService);
  private readonly editorGitService = inject(EditorGitService);
  private readonly editorDocumentStateService = inject(
    EditorDocumentStateService,
  );

  /**
   * Keeps track if the system has GIT version control
   */
  public readonly hasGit = signal(false);

  /**
   * Holds the current git branch
   */
  public readonly currentBranch = signal<string | null>(null);

  /**
   * Keeps track if the user has opened a document and selected line col and row
   */
  public readonly selectedLines =
    this.editorDocumentStateService.selectedLineAndColumn;

  /**
   * Keeps track of the latest git blame line information
   */
  public readonly gitBlameLineInformation =
    this.editorGitService.gitBlameLineInformation;

  /**
   * Keeps track of the current selected directory path
   */
  private readonly selectedDirectory = this.editorWorkspaceService.workspace;

  constructor() {
    useEffect(
      (_, dir) => {
        if (!dir) return;
        this.getCurrentGitBranch(dir);
      },
      [this.selectedDirectory],
    );
  }

  /**
   * Holds count of how many diagnostic error we have
   */
  public readonly diagnosticErrorCount: Signal<number> = computed(() => {
    this.editorDocumentDiagnosticService.valueChanged(); // dep
    let count = 0;
    const map = this.editorDocumentDiagnosticService.getAllDiagnostics();

    for (const [_, diags] of map) {
      if (diags.length > 0) {
        count += 1;
      }
    }
    return count;
  });

  /**
   * Display the current branch
   * @param directory The directory selected in the editor
   */
  private async getCurrentGitBranch(directory: string) {
    try {
      const branch = await this.electronApi.gitApi.getCurrentBranch(directory);
      this.currentBranch.set(branch);
    } catch (error) {
      console.error("Failed to get current git branch ", error);
    }
  }
}
