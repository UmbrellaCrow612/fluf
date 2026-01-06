import { Extension, StateField, StateEffect } from '@codemirror/state';
import { linter, LintSource, lintGutter } from '@codemirror/lint';
import { EditorView } from '@codemirror/view';
import { FlufDiagnostic } from '../diagnostic/type';

const setDiagnostics = StateEffect.define<FlufDiagnostic[]>();

const externalDiagnosticField = StateField.define<FlufDiagnostic[]>({
  create() {
    return [];
  },
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setDiagnostics)) {
        return effect.value;
      }
    }
    return value;
  },
});

const externalLinter: LintSource = (view: EditorView) => {
  const diagnostics = view.state.field(externalDiagnosticField);

  return diagnostics;
};

export function externalDiagnosticsExtension(): Extension {
  return [externalDiagnosticField, lintGutter(), linter(externalLinter)];
}

export function applyExternalDiagnostics(
  view: EditorView,
  diagnostics: FlufDiagnostic[],
) {
  view.dispatch({
    effects: [setDiagnostics.of(diagnostics)],
  });
}
