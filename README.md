# Flufy 

Simple text editor

# Feature goals

- open folder
- side bar see all files and folders
- create file ro folder
- click see file or folder 
- edit text in file or folder
- custom build script to build react app and then package it with electron

# Overview

- `UI` - Contains out ui source code built in react and webpack
- `Desktop` - Contains ourdesktop wrapper code built with electron and scripts
- `Scripts` - Contains our custom build scripts to build for desktop using electron and react source code


# Running 

- Read UI readme 
- Read desktop readme

# Building 

- set up scripts deps cd into scripts and run `npm ci`
- then from root run `node .\scripts\build.js` pass any args it needs