import { Extension, StateField, StateEffect } from "@codemirror/state";
import { linter, Diagnostic, LintSource, lintGutter } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";

const setDiagnostics = StateEffect.define<Diagnostic[]>();

const externalDiagnosticField = StateField.define<Diagnostic[]>({
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
  return [
    externalDiagnosticField,
    lintGutter(),
    linter(externalLinter)
  ];
}

export function applyExternalDiagnostics(view: EditorView, diagnostics: Diagnostic[]) {
  view.dispatch({
    effects: [setDiagnostics.of(diagnostics)]
  });
}