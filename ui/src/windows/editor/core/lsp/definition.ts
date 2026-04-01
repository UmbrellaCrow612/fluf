import { Definition, Location } from "vscode-languageserver-protocol";
import { getElectronApi } from "../../../../shared/electron";
import { EditorFileOpenerService } from "../services/editor-file-opener.service";
import { EditorStateService } from "../state/editor-state.service";
import { EditorView } from "codemirror";

const electronApi = getElectronApi();

const impl = async (
  location: Location,
  fpOpener: EditorFileOpenerService,
  state: EditorStateService,
) => {
  const uri = location.uri;
  const asPathLike = await electronApi.pathApi.fromUri(uri);
  const node = await electronApi.fsApi.getNode(asPathLike);
  state.scrollToDefinitionLocation.set(location);
  fpOpener.openFileNodeInEditor(node);
};

/**
 * Open a file / go to definition of a file in the editor
 * @param definition The LSP definition
 * @param fpOpener Service
 */
export const goToDefinitionInEditor = async (
  definition: Definition,
  fpOpener: EditorFileOpenerService,
  state: EditorStateService,
) => {
  try {
    if (Array.isArray(definition)) {
      await impl(definition[0], fpOpener, state);
    } else {
      await impl(definition, fpOpener, state);
    }
  } catch (error) {
    console.error("Failed to go to definition");
  }
};

/**
 * Convert a VSCode Location to a CodeMirror absolute offset,
 * then scroll that position into view.
 */
export function scrollToVSCodeLocation(
  view: EditorView,
  location: Location,
): void {
  const { start } = location.range;
  const doc = view.state.doc;

  // VSCode lines are 0-based; CodeMirror's line() also accepts 1-based,
  // so add 1 to convert.
  const line = doc.line(start.line + 1);

  // Clamp character offset to line length to avoid going out of bounds
  const ch = Math.min(start.character, line.length);

  // Absolute offset into the document
  const pos = line.from + ch;

  // Dispatch a scroll effect to bring the position into view
  view.dispatch({
    effects: EditorView.scrollIntoView(pos, {
      y: "center", // 'start' | 'end' | 'nearest' | 'center'
      x: "nearest",
    }),
  });
}
