# Theme Feature 

Contains all services, component other stuff related to the theme related logic



# CSS vars to JS Object

- Inside of `styles.css` we define all the css vars we use in the app
- Then use `cssVarToJsObject.js` to generate a js object 
- Whenever styles.css css vars change i.e remove, add, edit defaults run the script here example

```bash
PS C:\dev\fluf> node .\scripts\ui\cssVarToJsObject.js C:\dev\fluf\ui\src\styles.css C:\dev\fluf\ui\src\gen\cssVars.ts
✓ Successfully extracted 68 CSS variables
✓ Output written to: C:\dev\fluf\ui\src\gen\cssVars.ts
PS C:\dev\fluf> 
```