import {
  Component,
  computed,
  inject,
  OnInit,
  Signal,
  signal,
} from "@angular/core";
import { EditorInMemoryStateService } from "../core/state/editor-in-memory-state.service";
import { getElectronApi } from "../../../shared/electron";
import { MatIconModule } from "@angular/material/icon";
import { EditorStateService } from "../core/state/editor-state.service";
import { MatTooltipModule } from "@angular/material/tooltip";
import { DatePipe } from "@angular/common";
import { EditorDocumentDiagnosticService } from "../core/lsp/editor-document-diagnostic.service";
import { EditorWorkspaceService } from "../core/services/editor-workspace.service";

@Component({
  selector: "app-editor-footer",
  imports: [MatIconModule, MatTooltipModule, DatePipe],
  templateUrl: "./editor-footer.component.html",
  styleUrl: "./editor-footer.component.css",
})
export class EditorFooterComponent implements OnInit {
  private readonly editorInMemoryStateService = inject(
    EditorInMemoryStateService,
  );
  private readonly electronApi = getElectronApi();
  private readonly editorStateService = inject(EditorStateService);
  private readonly editorDocumentDiagnosticService = inject(
    EditorDocumentDiagnosticService,
  );
  private readonly editorWorkspaceService = inject(EditorWorkspaceService);

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
  public readonly selectedLines = computed(() =>
    this.editorInMemoryStateService.selectedLineAndColumn(),
  );

  /**
   * Keeps track of the latest git blame line information
   */
  public readonly gitBlameLineInformation = computed(() =>
    this.editorInMemoryStateService.gitBlameLineInformation(),
  );

  /**
   * Keeps track of the current selected directory path
   */
  private readonly selectedDirectory = this.editorWorkspaceService.workspace;

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

  async ngOnInit() {
    await this.checkIfSystemHasGit();
    await this.getCurrentGitBranch();
  }

  private async checkIfSystemHasGit() {
    try {
      const hasGit = await this.electronApi.gitApi.hasGit();
      this.hasGit.set(hasGit);
    } catch (error) {
      console.error("Failed to check if system has git ", error);
    }
  }

  private async getCurrentGitBranch() {
    try {
      const dir = this.selectedDirectory();
      if (!dir) {
        return;
      }

      const branch = await this.electronApi.gitApi.getCurrentBranch(dir);
      this.currentBranch.set(branch);
    } catch (error) {
      console.error("Failed to get current git branch ", error);
    }
  }
}
