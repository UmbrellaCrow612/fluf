# Desktop

Contains all our desktop specific code built with electron and esbuild


# Before 

- Extra component - MSVC v143 - VS 2022 C++ x64/x86 Spectre-mitigated libs (Latest) - based the version my vs version
- visual studio and desktop c++ component visual studio component
- NVM https://github.com/coreybutler/nvm-windows/releases
- nvm install 16
- nvm use nvm use 16.20.2

```bash
rm -rf node_modules
rm package-lock.json # or yarn.lock if using yarn
npm install
.\node_modules\.bin\electron-rebuild.cmd
```

# Running

- Download nvm https://github.com/coreybutler/nvm-windows/releases
- Download `nvm install 16`
- Use `nvm use nvm use 16.20.2`
- Install deps `npm ci`
- `.\node_modules\.bin\electron-rebuild.cmd`
- For dev make sure the `.env` mode is in `dev`
- Make sure the front end is running in dev as well
- run `npm run start`


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
and `npx eslint .` for errors


# Info 

Build script:
- copys .env file
- copys pack json
- es builds index.js and preload js - note should only minify and exclude electron
- puts into a dist folder
- end
