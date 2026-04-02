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

  const line = doc.line(start.line + 1);
  const ch = Math.min(start.character, line.length);
  const pos = line.from + ch;

  view.dispatch({
    selection: { anchor: pos, head: pos },
    effects: EditorView.scrollIntoView(pos, {
      y: "center",
      x: "nearest",
    }),
    scrollIntoView: true,
  });

  view.focus();
}
