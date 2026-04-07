import { Location } from "vscode-languageserver-protocol";
import { EditorView } from "codemirror";

/**
 * Convert a VSCode Location to a CodeMirror absolute offset,
 * then scroll that position into view.
 */
export function scrollToVSCodeLocation(
  view: EditorView,
  location: Location,
): void {
  console.warn("scrollToVSCodeLocation  ran");
  const { start } = location.range;
  const doc = view.state.doc;

  const line = doc.line(start.line + 1);
  const ch = Math.min(start.character, line.length);
  const pos = line.from + ch;

  setTimeout(() => {
    view.dispatch({
      selection: { anchor: pos, head: pos },
      effects: EditorView.scrollIntoView(pos, {
        y: "center",
        x: "nearest",
      }),
      scrollIntoView: true,
    });

    view.focus();
  });
}
