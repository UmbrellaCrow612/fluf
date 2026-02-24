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
- Stage one: combine UI and desktop
- Stage two: Asar them
- Stage three: move electron binarys into stage three, move app asar into resources, rename exe
- Stage four: move desktop package.json deps node_modules into resources, move binarys into resources, move .env into stage three root
