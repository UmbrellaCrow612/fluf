# Desktop

Contains all our desktop specific code built with electron and esbuild

# Running / re run steps

```bash
nvm use 22
npm ci
npm run binman
npm run start
```

# Style guide

- Use plain js common js
- Write function defitions with ` * @callback readFile` then implament them like this for type checking

```js
/**
 * @type {readFile}
 */
const readFileImpl = async (event = undefined, filePath) => {
  return "";
};
```

# Type checking

cmd

run `npx tsc` to see for any errors and generating frontend ts types to use and generate types for ui

# Info


Building:

- Build index.js and preload with es build excluding electron and node pty etc packs
- Copy pack json, .env and es build into dist
- Copy any external deps - for now typescriopt server source code into dist as well for lang suppport
- Download any external binarys into bin
- All files made for final packing
