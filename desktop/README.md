# Desktop

Contains all our desktop specific code such as acessing files etc, built with electron and esbuild.

# Running / re run steps

```bash
npm ci
npm run binman
npm run start
```

# Style

- Write jsdoc and it's type for all methods as well as typescript types

# Notes

- Build will run typescript - copy types over to ui for window object have types and also remove the export from preload js at the end so it can load in the browser
- Migrated from jsdoc to ts
- Use typed icp main and ipc render pattern now we get full type saftey for channels and what args they recieve / get, each module exports it's events / channels and args

# Building

Steps we need todo

- Build the ts code using module config for other code and then common js for preload
- Copy over `.env`, `node_modules` deps, `package.json` and binary's `bin/**`

```bash
--- final
 .env
 node_modules - specific deps
 package.json
 dist ts dist files
 bin
```
