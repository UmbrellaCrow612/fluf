# Sanity

Contains end to end tests using playwright to test core functionality

# Set up

```bash
npm ci
```

Somtimes you need to install the browsers 

```bash
npx playwright install
```

# Runinng

- Run UI -> `npm ci`
- Build desktop -> `cd into desktop -> npm ci -> npm run build:dev`
- Testing via cli cmd make sure your not running UI as this will run it in web server

```bash
 npx playwright test
```

It is basically how we run it in development

# Code gen workflow

Build it

```bash
cd into build => npm run build:dev
```

Run UI 

```bash
cd UI -> npm run start
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
- This project will as part of playwright config cd into UI and run the web server
