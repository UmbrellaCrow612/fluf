# Build

- Used to build the final version of the source code as a artifact
- Written as script files in es modules
- Each build script should be self contained
- Make it built for the current device it's running on so to build for a specific target we run the given builed on that machine

# Setup

```bash
npm ci
```

# Build example

```bash
npm run build
```

# Build proccess

- Build desktop -> change .env MODE to prod
- Build UI
- Combine them - Stage one
- Asar them - Stage two
- Stage three -> Download eleectron binarys -> move asar file into resoucres
- Stage four -> move desktop binarys into resoucres path and node_modules from desktop pack.json into resoucres
