import { computed, Injectable, Signal, signal } from "@angular/core";
import { Diagnostic as vscodeDiagnostic } from "vscode-languageserver-protocol";
import { normalize } from "../../../../lib/path";

/**
 * Contains all diagnostics for documents
 */
@Injectable({
  providedIn: "root",
})
export class EditorDocumentDiagnosticService {
  private readonly _changed = signal(0);
  private readonly _emittedChanged = () => this._changed.update((x) => x + 1);
  private readonly _documentDiagnosticMap = new Map<
    string,
    vscodeDiagnostic[]
  >();

  /**
   * Signal which changes / subscribe to when document problems map changes i.e new problems come in
   */
  public readonly valueChanged: Signal<number> = computed(() =>
    this._changed(),
  );

  /**
   * Get diagnostics for a specific document
   * @param filePath The document file path
   * @returns List of diagnostics
   */
  public getDiagnostics(filePath: string): vscodeDiagnostic[] {
    const diags = this._documentDiagnosticMap.get(normalize(filePath));
    if (!diags) {
      return [];
    }
    return diags;
  }

  /**
   * Set diagnostics for a specific document
   * @param filePath The document path
   * @param diagnostics List of diagnostics
   */
  public setDiagnostics(
    filePath: string,
    diagnostics: vscodeDiagnostic[],
  ): void {
    this._documentDiagnosticMap.set(normalize(filePath), diagnostics);
    this._emittedChanged();
  }

  /**
   * Get all documents and their diagnostics
   * @returns Map containing specific document and its diagnostics
   */
  public getAllDiagnostics(): Map<string, vscodeDiagnostic[]> {
    return structuredClone(this._documentDiagnosticMap);
  }
}
