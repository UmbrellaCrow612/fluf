import { EditorState, Extension, StateField, StateEffect } from "@codemirror/state";
import { linter, Diagnostic, LintSource } from "@codemirror/lint";
import { EditorView } from "@codemirror/view";

// 1. Define the Effect to update the diagnostics
// This effect is the mechanism we use to inject new diagnostics into the editor state.
const setDiagnostics = StateEffect.define<Diagnostic[]>();

// 2. Define the State Field
// This field holds the current array of external diagnostics.
export const externalDiagnosticField = StateField.define<Diagnostic[]>({
  // Initialize with an empty array
  create() {
    return [];
  },
  // Apply changes when the setDiagnostics effect is dispatched
  update(value, tr) {
    for (const effect of tr.effects) {
      if (effect.is(setDiagnostics)) {
        // Replace the old diagnostics with the new ones from the effect
        return effect.value;
      }
    }
    // Otherwise, return the current value
    return value;
  },
});

// 3. Define the Linter Source
// This linter reads the diagnostics from the state field.
const externalLinter: LintSource = (view: EditorView) => {
  // Get the current diagnostics array from the state field
  const diagnostics = view.state.field(externalDiagnosticField);
  
  // Return the diagnostics array
  return diagnostics;
};

// 4. Create the final extension
/**
 * Creates the CodeMirror extension that enables external diagnostics.
 * This should be included in your EditorState extensions array.
 * @returns The CodeMirror extension.
 */
export function externalDiagnosticsExtension(): Extension {
  return [
    // Include the state field to store the diagnostics
    externalDiagnosticField,
    // Include the linter extension, which uses the state field as its source
    linter(externalLinter)
  ];
}

// 5. The function you will call whenever new external data is available
/**
 * Updates the editor's state with a new set of external diagnostics.
 * Dispatching this effect will automatically trigger the linter to refresh.
 * @param view The CodeMirror EditorView instance.
 * @param diagnostics The new array of Diagnostic objects.
 */
export function applyExternalDiagnostics(view: EditorView, diagnostics: Diagnostic[]) {
  // Dispatch a transaction with the setDiagnostics effect
  view.dispatch({
    effects: [setDiagnostics.of(diagnostics)]
  });
}