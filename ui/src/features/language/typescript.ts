import { EditorState } from '@codemirror/state';
import { Diagnostic } from '@codemirror/lint';
import { tsServerOutput, tsServerOutputDiagnostic } from '../../gen/type';
import { CodeMirrorSeverity, diagnosticType } from './type';

/**
 * Convert typescript diagnostics to code mirror diagnostics
 * @param from The list of TS server output messages
 * @param state The CodeMirror editor state (needed to convert line/offset → absolute positions)
 */
export function mapTypescriptDiagnosticToCodeMirrorDiagnostic(
  from: tsServerOutput,
  state: EditorState
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  const bodyDiagnostics = from?.body?.diagnostics;
  if (!bodyDiagnostics || !from?.body || !from?.body?.file) return [];

  for (const d of bodyDiagnostics) {
    const fromPos = positionToOffset(state, d.start.line, d.start.offset);
    const toPos = positionToOffset(state, d.end.line, d.end.offset);

    diagnostics.push({
      from: fromPos,
      to: toPos,
      severity: mapSeverity(d.category),
      message: d.text,
      source: 'typescript',
    });
  }

  return diagnostics;
}

/**
 * Convert a TS line/column pair to a CodeMirror document offset.
 * TypeScript lines/offsets are 1-based, CodeMirror uses 0-based.
 */
function positionToOffset(
  state: EditorState,
  line: number,
  col: number
): number {
  try {
    const lineHandle = state.doc.line(line); // 1-based API
    return lineHandle.from + (col - 1);
  } catch {
    return 0; // fallback if TS gives invalid ranges
  }
}

function mapSeverity(
  category: tsServerOutputDiagnostic['category']
): CodeMirrorSeverity {
  switch (category) {
    case 'error':
      return 'error';
    case 'suggestion':
      return 'info';
    case 'message':
    default:
      return 'warning';
  }
}
