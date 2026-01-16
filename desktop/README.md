# Desktop

Contains all our desktop specific code built with electron and esbuild

# Running / re run steps

```bash
nvm use 22
npm ci
npm run binman
npm run start
```

# Style Guide

* Use plain JavaScript (CommonJS) with JSDoc.
* Write types in `types.js`.
* Use `CombinCallback` on the backend side to type the listener with the public API and the Electron event being attached. This saves us from having to write another type for it.
* In `preload.js`, make each API have its own object that contains the related features, for example `shellApi`.
* In `preload.js`, when typing the APIs, if they do not receive a callback as a parameter, use `...args` for the parameters and pass them to IPC as `...args`.
  This saves trouble when extending the API usage: the frontend will throw a type error if you don’t pass the required arguments, and they will automatically be forwarded through the bridge.
* Whenever you extend `types.js`, run `npx tsc` in the `desktop` directory to generate the types for the UI.

# Type checking 

- tsconfig.check.json holds rules from jsconfig but allows us to just use it for type checking

```bash
npx tsc -p tsconfig.check.json
```

# Info

Building:

- build index.js and preload with esbuild dist
- exclude electron, node pty ("@homebridge") from esbuild
- copy over typescript source code
- copy over node pty (@homebridge)
- copy over .env and pack json into dist
- pack the app into asar
- download electron binarys into dist
