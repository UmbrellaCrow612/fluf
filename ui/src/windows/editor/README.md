# Editor

Represents the main editor that is shown fluf is opened - editor contains all the features for code edit's to work

# Styles

- Prefix each component with editor-
- Use default angular components for each UI element instead of making our own
- Each component css styles prefixed with it's name or part of the name like editor*frame*
- Use either public or private - if the variable is never read in UI or should not then use `private` else make it public and assume it can be used in UI
- Use angular `@` syntax for UI templates
- use pascal case
- Use signals for ever field that is read into UI saves render cycles

Understand flex - we use flex for layout and filling so to get overflow properly working first:

- Parent must have display flex, min height, min width all the way up from it self to root body tag which has the same
- Component render with extra angular html element like `<angular_html_tag>actual html of component<angular_html_tag>` so inside of the component
  add `:host {display:flex; min-height:0; min-width:0;}` so overflow works properly, whenever you get broken over flow it is becuase this rule has been broken in the chain of HTML
  heirarchy use dev tools to find the tag and apply said styles all the way down
  - Use signals for all private and public fields used in UI as using function calls for computing UI text or other stuff run every angular cycle wasting compute and slowing app
- Inside classes define DI first then fields that hold state then function defs after
- For active, error, loading css use the parent css name then add a `.active` etc state based on what your doing instead of making a whole new css for example:

```css
.parent {
}

.parent.active {
}

.parent.error {
}
```

- Use angular `[class.className]` syntax to apply them
- Whenever you compare paths normlize them first
- Write component or service etc and all there logic then in the end just get AI kimi to check if the name means what it's doing and rename it to have a clear name of what it does

- For enum types use this pattern:

```ts
/**
 * All the components that can be rendered in the middle of the text editor.
 */
export const EDITOR_MAIN_ACTIVE_ELEMENT = {
  PLAIN_TEXT_FILE_EDITOR: "plain-text-file-editor",
  IMAGE_EDITOR: "image-editor",
  VIDEO_EDITOR: "video-editor",
  PDF_EDITOR: "pdf-editor",
  UNKNOWN: "unknown",
  CODE_EDITOR: "code-editor",
  AUDIO_EDITOR: "audio-editor",
  MARKDOWN_EDITOR: "markdown-editor",
} as const;

/**
 * Valid main editor elements
 */
export type editorMainActiveElement = (typeof EDITOR_MAIN_ACTIVE_ELEMENT)[keyof typeof EDITOR_MAIN_ACTIVE_ELEMENT] | null;

/**
 * Contains a map of all valid editor main active elements
 */
export const EDITOR_VALID_MAIN_ACTIVE_ELEMENTS: Set<editorMainActiveElement> = new Set<any>(Object.values(EDITOR_MAIN_ACTIVE_ELEMENT));
```

# Docs

- The angular material icons https://fonts.google.com/icons?icon.set=Material+Icons&icon.size=24&icon.color=%231f1f1f
