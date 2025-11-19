# Scripts

Contains all out build scripts

# Set up to build

- run `npm ci` for utils deps

# Style guide

- scripts are written in common js and plain js
- use deps as it's not code shipped but simpley helper code to build the final thing
- View packged files in `app.asar` `npx asar list ..\dist\resources\app.asar`

# Info

What build script try to achieve:

- build frontend angular code
- build desktop code
- put them both into a app folder
- copy bin desktop folder as wel
- asar the app files
- then download and add the electron binarys
- done

# Buidling app

```bash
root folder> node .\scripts\build.js --platform=linux, windows or darwin
```

Only builds for x64 for each
