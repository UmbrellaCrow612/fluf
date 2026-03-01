# Sanity

Contains end-to-end tests using Playwright to test core functionality.

# Setup

```bash
npm ci
```

Sometimes you need to install the browsers:

```bash
npx playwright install
```

# Running

- Run UI → `npm ci`
- Build desktop → `cd` into desktop → `npm ci` → `npm run build:dev`
- Note: you do not need to run the UI project; just install its deps → Playwright web server will run it for us.

```bash
npx playwright test
```

It is basically how we run it in development.

# Codegen workflow

Build it:

```bash
cd build => npm run build:dev
```

Run UI:

```bash
cd UI => npm run start
```

Use custom script to help with writing the test steps:

```bash
node .\scripts\electron-codegen.mjs
```


# Writing tests

- Use codegen above steps
- Use defined custom `test` `fixture.ts` as it scafolds enviroment for each test needs

# Notes

- This is a Node.js project, so treat it as a Node project. You have access to Node APIs and also those of Playwright, so you can do stuff in the UI—for example, file edits—and check if said file was created and has the content, etc.
- We basically point to the compiled desktop code after building it and set the cwd to the project because of .env stuff, and treat it as running the desktop project normally.
- Writing tests: use the Playwright codegen toolkit, but we need to have a small workaround and use a custom script to launch the viewer; run `node .\scripts\electron-codegen.mjs`.
- This project will, as part of the Playwright config, `cd` into UI and run the web server.
