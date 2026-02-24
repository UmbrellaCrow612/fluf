# Desktop

Contains all out desktop api code written in typescript built using esbuild


# Getting started

- Copy `.env.example` -> `.env` locally
- Change `MODE` to dev
- Run the frotnend first
- Run with `npm run dev` for a dev build
- Run with esbuild / prod version with `npm run prod` version


# Notes 

## Build process

- We write code in src using typescript then build it to -> staging which is the raw JS needed for electron to consume
- We then fix the preload.js script to remove module based syntax as it cannot be loaded in the browser with that
- Then either bundle it into a single file using esbuild for index and preload js or just copy the staging -> dist for better logs to see which file made the log but bascially the same
- Then we copy static files needed for it to work in dist such as .env and package.json so electron nows which file is the one to launch
- Then we run electron sindie the dist folder and it has eveything it needs to run
