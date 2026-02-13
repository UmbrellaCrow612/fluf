# UI

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.10.

# Running

**Development:**

- `npm ci`
- `npm run start`

#**Type checking**:

Sometimes types generated from `desktop` change and `npm run start` does not catch them run `tsc --noEmit` for these.

**Build:**

- `npm run build`

# Notes

- When using Flex Layout and `flex: 1`, make sure the first descendant has a defined height (e.g., `100vh`). This usually applies to the `body` element and each subchild that uses flex layout containers. Add the following styles:

  ```css
  min-height: 0;
  min-width: 0;
  ```

  This ensures that overflow properties work correctly when the container uses flex or percentage-based layouts.

- Sometimes, even if a child component is assigned `flex: 1` by a parent with `display: flex`, it might still not take up the full width. Make sure both the parent and the child have defined minimum width and height. For example, in the CSS file of `<app-child />`, include:

  ```css
  :host {
    flex: 1;
    display: flex;
    min-height: 0;
    min-width: 0;
  }
  ```

  The `:host` wrapper acts as an HTML element itself, so these properties help ensure proper flex behavior.

- When creating terminals make sure to not `ctrl c ` the electron processes but quit with the x button to kill all procsses\

- Use `signals` as much as possible for fields as they cause less render cycles for example:

```js
/** Holds loading state */
  isLoading = signal(false);

  /** Holds error state  */
  errorMessage = signal<string | null>(null);

  /** Holds the list of children read from the directory */
  directoryFileNodes = signal<fileNode[]>([]);
```

- Offer generic util helpers such as `OpenNodeInEditor(fileNode)` so we have a central way of doing it and other services or parts of the application can use it.

- When making components or css classes make it prefix with the module such as `editor-side-bar` or `.editor_class`

# Structure 

Ui refers to all UI related code for noew it is split up into 

## Windows 

Represents a application or part of fluffy that is rendered as part of a whole chrome window - self contained app

- `editor` - The code editor
- `filex` - The file explorer
