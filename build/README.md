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
- Combine them
- Asar them
- Download electron binarys
- Move the asar app into the binary
- Final output
