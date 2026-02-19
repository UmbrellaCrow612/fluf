# Desktop

Contains all our desktop specific code such as acessing files etc, built with electron and esbuild.

# Running / re run steps

```bash
npm ci
npm run binman
npm run dev
```

# Style

- Write jsdoc and it's type for all methods as well as typescript types

# Notes

- Migrated from jsdoc to ts
- Use typed icp main and ipc render pattern now we get full type saftey for channels and what args they recieve / get, each module exports it's events / channels and args

# Building

- First build typescript code into raw js files:
-- Don't produce map or d files as it is not a libary
- Then fix preload script remove export's in `staging/preload.js` because only common js is allowed in preload file
- Copy over type's file to UI so they get type information from backend api's
- Use esbuild on the `staging/index.js` which is our main entry point for electron app:
-- Make sure any deps are external so we don't bundle there code as we will copy over node_modules needed instead of bundling them
-- Minify it for prod and not for dev so we get better error logs of where stuff is happening
- Use esbuild on `staging/preload.js` -> `dist/preload.js` same reasons as above

