# Desktop

Contains all our desktop specific code built with electron and esbuild


# Before 

- Extra component - MSVC v143 - VS 2022 C++ x64/x86 Spectre-mitigated libs (Latest) - based the version my vs version
- visual studio and desktop c++ component visual studio component
- NVM https://github.com/coreybutler/nvm-windows/releases
- nvm install 16
- nvm use nvm use 16.20.2
- Stick to node 16 and electron 19 for node pty to work any deps downloaded or installed need to be with node 16
- Have python installed


# Running / re run steps

```bash
nvm use 16
rm -rf node_modules
rm package-lock.json 
remove "electron-rebuild": "^3.2.9", from package json
npm install
npm install electron-rebuild -- save dev
.\node_modules\.bin\electron-rebuild.cmd
```

Run the in `c/desktop folder` `node scripts/install.js` then `npm run start` for dev make sure .env is dev mode and points to UI


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

Build script: putpose - make a dist folder contaning nceecary file like preload and index js and no electron or other deps like node pty

- use specific install steps for deps to work use node 16 delete deps reinstall specific order
- copys .env file
- copys pack json
- es builds index.js and preload js - note should only minify and exclude electron and not pty
- puts into a dist folder
- end

bin:
anbother folder wich will contain all third party external binarys needed to extra functionality 

dist:
will contain electron bundled files like pack, preload and index as well as .env exclude electron and node in compliation

Ripgrep:

- We download the ripgrep binary for now windows but future specific for the build bundle where gonna make and then spawn that
- Use the local bin ripgrep version to spawn and use ripgrep