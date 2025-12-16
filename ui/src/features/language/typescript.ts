import { EditorState } from '@codemirror/state';
import { Diagnostic } from '@codemirror/lint';
import {
  tsServerOutput,
  tsServerOutputBodyCompletionEntry,
  tsServerOutputBodyDiagnostic,
} from '../../gen/type';
import { CodeMirrorSeverity, diagnosticType } from './type';
import { Completion } from '@codemirror/autocomplete';

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
  category: tsServerOutputBodyDiagnostic['category']
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

const tsKindToCmType: Record<string, string> = {
  // functions / calls
  function: 'function',
  method: 'method',
  constructor: 'function',
  call: 'function',

  // variables / values
  var: 'variable',
  let: 'variable',
  const: 'constant',
  localvar: 'variable',
  'local var': 'variable',
  parameter: 'variable',
  property: 'property',

  // types
  class: 'class',
  interface: 'interface',
  enum: 'enum',
  'enum member': 'enum',
  type: 'type',
  'type parameter': 'type',
  'primitive type': 'type',
  alias: 'type',

  // modules / namespaces
  module: 'namespace',
  'external module name': 'namespace',

  // keywords & text
  keyword: 'keyword',
  string: 'text',

  // fallback
  label: 'text',
  script: 'text',
};

export function mapTsEntryToCompletion(
  entry: tsServerOutputBodyCompletionEntry
): Completion {
  const label = entry.name ?? '';

  return {
    label,

    // Prefer insertText if tsserver provided one
    apply: entry.insertText ?? label,

    sortText: entry.sortText ?? label,

    detail: entry.kind,

    type: entry.kind ? tsKindToCmType[entry.kind] ?? 'text' : 'text',

    commitCharacters: entry.commitCharacters,

    // Optional info panel (can be expanded later)
    info: entry.source ? `From ${entry.source}` : undefined,

    // Small ranking tweak for recommended items
    boost: entry.isRecommended ? 10 : 0,
  };
}

export function mapTsServerOutputToCompletions(
  output: tsServerOutput
): Completion[] {
  const entries = output.body?.entries;
  if (!entries || entries.length === 0) return [];

  return entries
    .filter((e): e is tsServerOutputBodyCompletionEntry => !!e.name)
    .map(mapTsEntryToCompletion);
}
