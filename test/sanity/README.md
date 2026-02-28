# Sanity

Contains end to end tests using playwright to test core functionality

# Set up

```bash
npx playwright install # Downloads browsers
npm ci
```

# Runinng

- Build desktop -> `cd into desktop -> npm ci -> npm run build`
- Run UI -> `cd into UI -> npm ci -> npm run start`

```bash
npm run tests
```

# Code gen

Build it 

```bash
cd into build => npm run build
```

Use custom script to help with writing the test steps:

```bash
node .\scripts\electron-codegen.mjs
```

# Notes

- This a node js project so treat it as a ndoe project you have acess to node api's and also those of playwright so you can do stuff in UI for example file
  edits and check if said file was created and has the content etc
- We basically point to the complied desktop code after building it and setting the cwd to the project becuase of .env stuff and treat it as runnign desktop project normally
- Writing tests - use the playwright code gen toolkit but we need to have a small workaround and use custom scritp to launch the viwer run `node .\scripts\electron-codegen.mjs`
