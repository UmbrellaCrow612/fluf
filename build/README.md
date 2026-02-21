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

- Build desktop
- Build UI
- Combine them - Stage one
- Asar them - Stage two
- Download electron binarys - done by default via npm ci -> move them to root for packing - Stage three
- Move asar app code into the binary eleectron downloaded - Stage four
