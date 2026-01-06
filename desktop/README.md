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

- build index.js and preload with esbuild dist
- exclude electron, node pty ("@homebridge") from esbuild
- copy over typescript source code
- copy over node pty (@homebridge)
- copy over .env and pack json into dist
- pack the app into asar
- download electron binarys into dist
