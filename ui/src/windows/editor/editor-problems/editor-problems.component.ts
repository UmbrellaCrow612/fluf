import { Component, inject, Inject, signal } from "@angular/core";
import { EditorDocumentDiagnosticService } from "../core/lsp/editor-document-diagnostic.service";
import { Diagnostic as vscodeDiagnostic } from "vscode-languageserver-protocol";
import { useEffect } from "../../../lib/useEffect";
import { MatIconModule } from "@angular/material/icon";

type uiDiagnosticItem = {
  filePath: string;
  diagnostics: vscodeDiagnostic[];
};
/**
 * Displays all editor problems in detail
 */
@Component({
  selector: "app-editor-problems",
  imports: [MatIconModule],
  templateUrl: "./editor-problems.component.html",
  styleUrl: "./editor-problems.component.css",
})
export class EditorProblemsComponent {
  private readonly editorDocumentDiagnosticService = inject(
    EditorDocumentDiagnosticService,
  );

  constructor() {
    useEffect(() => {
      this.render();
    }, [this.editorDocumentDiagnosticService.valueChanged]);
  }

  /**
   * Holds current diagnostics to render
   */
  public readonly fileDiagnostics = signal<uiDiagnosticItem[]>([]);

  /**
   * Gets latest diagnostics and shows UI
   */
  private render() {
    const lspDiagnostics =
      this.editorDocumentDiagnosticService.getAllDiagnostics();

    const array: uiDiagnosticItem[] = [];
    for (const [key, value] of lspDiagnostics) {
      if (value.length > 0) {
        array.push({ filePath: key, diagnostics: value });
      }
    }

    this.fileDiagnostics.set(array);
  }

  public getSeverityClass(severity: vscodeDiagnostic["severity"]): string {
    switch (severity) {
      case 1:
        return "severity-error";
      case 2:
        return "severity-warning";
      case 3:
        return "severity-info";
      case 4:
        return "severity-hint";
      default:
        return "severity-error";
    }
  }

  public getSeverityMatIcon(severity: vscodeDiagnostic["severity"]): string {
    switch (severity) {
      case 1:
        return "error";
      case 2:
        return "warning";
      case 3:
        return "info";
      case 4:
        return "lightbulb";
      default:
        return "error";
    }
  }
}
