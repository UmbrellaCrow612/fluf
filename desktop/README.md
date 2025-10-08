# Desktop

Contains all our desktop specific code built with electron and esbuild

# Running

- Install deps `npm ci`
- For dev make sure the `.env` mode is in `dev`
- Make sure the front end is running in dev as well
- run `npm start`


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

run `npx tsc --noEmit` to see for any errors
