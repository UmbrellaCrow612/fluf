import { Signal } from "@angular/core";
import { Extension, StateEffect, StateField } from "@codemirror/state";
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from "@codemirror/view";

/**
 * Holds signal when read tels us if control is pressed
 */
let isCtrlPressed: Signal<boolean> | null = null;

const setHoverWord = StateEffect.define<{ from: number; to: number } | null>();

const hoverUnderlineField = StateField.define<DecorationSet>({
  create() {
    return Decoration.none;
  },
  update(deco, tr) {
    for (let e of tr.effects) {
      if (e.is(setHoverWord)) {
        return e.value
          ? Decoration.set([hoverMark.range(e.value.from, e.value.to)])
          : Decoration.none;
      }
    }
    return deco.map(tr.changes);
  },
  provide: (f) => EditorView.decorations.from(f),
});

const hoverMark = Decoration.mark({ class: "cm-hover-underline" });

const hoverPlugin = ViewPlugin.fromClass(
  class {
    update(update: ViewUpdate) {}
  },
  {
    eventHandlers: {
      mousemove(e, view) {
        const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
        if (pos == null) {
          view.dispatch({ effects: setHoverWord.of(null) });
          return;
        }
        const word = view.state.wordAt(pos);
        if (!word) {
          view.dispatch({ effects: setHoverWord.of(null) });
          return;
        }

        const ctrlPressed = isCtrlPressed ? isCtrlPressed() : false;

        if (!ctrlPressed) {
          return;
        }

        view.dispatch({
          effects: setHoverWord.of({ from: word.from, to: word.to }),
        });
      },
      mouseleave(_e, view) {
        view.dispatch({ effects: setHoverWord.of(null) });
      },
    },
  },
);

const hoverTheme = EditorView.baseTheme({
  ".cm-hover-underline": {
    textDecoration: "underline 2px currentColor",
    cursor: "pointer",
  },
});

/**
 * Creates a extenions that apply styles to UI when user hovers over word
 */
const hoverUnderlineExtensions = [hoverUnderlineField, hoverPlugin, hoverTheme];

/**
 * Creates the needed extensions to allow the underline styles to be applied to the UI tokens when ctrl is pressed
 */
export function createGoToDefinitionHoverStyles(
  getIsControlPressed: Signal<boolean>,
): Extension[] {
  isCtrlPressed = getIsControlPressed;
  return hoverUnderlineExtensions;
}
