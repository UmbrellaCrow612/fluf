import { Diagnostic } from '@codemirror/lint';

/**
 * Extends the CodeMirror diagnostic with additional fields
 */
export interface FlufDiagnostic extends Diagnostic {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}
