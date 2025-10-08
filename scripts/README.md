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
- build frontend react code 
- build desktop code
- put them both into a app folder
- asar it 
- then download and add the electron binarys