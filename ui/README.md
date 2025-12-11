# UI

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.2.10.

# Running

**Development:**

- `npm ci`
- `npm run start`

Type checking:

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
- When setting inital ctx from app context name it `init` and when passing callback for autosub name the param `ctx`
