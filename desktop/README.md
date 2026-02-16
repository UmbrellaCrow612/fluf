# Desktop

Contains all our desktop specific code such as acessing files etc, built with electron and esbuild.

# Running / re run steps

```bash
npm ci
npm run binman
npm run start
```


# Style 

- write jsdoc and it's type for all methods as well as typescript types

# Notes

- When using typescript the preload js file must be generated using diffrent common js complier as it is in the browser using the same ts config 
as the other files adds `export {}` at the end breaking it in the browser. Hence we use the default ts config for backend code and the preload specific ts config for the browser code 
of `preload.ts`
- Instead of coping over the node_modules specific packages just copy all the source code with the node_module naming like how vscode does it so

# Building

Steps we need todo 

- Build the ts code 
- Copy over `.env`, `node_modules` deps, `package.json` and binary's `bin/**`

```bash
--- final
 .env
 node_modules - specific deps
 package.json
 dist ts dist files
 bin
```