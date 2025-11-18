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
root folder> node .\scripts\build.js --platform=windows --electronVersion=v38.2.1 --platformPackage=electron-v38.2.1-win32-x64.zip
```

TODO later:

- make it support all platforms properly and only bundle neccary binarys for said platform just pass the platform string
down script layers like binman would run `npppx binman . --platform-linux` to just get linux binarrys and then that would be in bin to be bundled etc