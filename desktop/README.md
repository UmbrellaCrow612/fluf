
# Desktop

Electron-based desktop application providing native system access (filesystem, shell, etc.) with a TypeScript backend and esbuild bundling.

## Quick Start

```bash
npm ci
npm run dev      # Development build with source maps
# or
npm run prod     # Production build (minified)
```

## Project Structure

```
desktop/
├── src/           # TypeScript source code
├── staging/       # tsc output (raw JS, unbundled)
├── dist/          # Final bundled app (electron entry point)
├── build.js       # Build orchestration script
└── package.json
```

## Build Process

The build pipeline (`build.js`) runs these steps:

1. **Clean** — Remove `dist/`, `staging/`, `bin/`
2. **Compile** — `tsc` transpiles `src/` → `staging/` (ES modules, no .d.ts or source maps)
3. **Binaries** — `binman` downloads platform-specific native dependencies
4. **Types Sync** — Copy `src/type.ts` → `../ui/src/gen/type.ts` (shares API types with frontend)
5. **Preload Fix** — Strip `export {}` statements from `staging/preload.js` (Electron preload requires CJS-style, no ESM exports)
6. **Bundle** — esbuild creates final artifacts:
   - `staging/index.js` → `dist/index.js` (main process)
   - `staging/preload.js` → `dist/preload.js` (preload script)
   - **Externals**: `electron`, `node-pty-prebuilt-multiarch`, `node-logy`, `typescript`, `umbr-binman` (excluded from bundle, loaded from `node_modules`)
   - **Minification**: Enabled in prod only for better stack traces in dev
7. **Static Files** — Copy `.env` and `package.json` to `dist/`

### Development vs Production

|                  | Development (`--dev`)              | Production (`--prod`) |
| ---------------- | ---------------------------------- | --------------------- |
| **Bundling**     | Files copied as-is from `staging/` | Full esbuild bundling |
| **Minification** | ❌ Disabled                        | ✅ Enabled            |
| **Error Traces** | Readable file paths                | Obfuscated            |
| **Build Speed**  | Fast (~copy only)                  | Slower (~full bundle) |

## Code Style

- JSDoc comments with TypeScript types for all public methods
- Use typed IPC pattern for ipc render, main and communication.