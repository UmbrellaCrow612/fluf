import js from "@eslint/js";
import globals from "globals";
import json from "@eslint/json";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.node },
    rules: {
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      "require-await": "error",
      "prefer-promise-reject-errors": "error",
      "no-async-promise-executor": "error",
      "no-promise-executor-return": "error",
      "no-constructor-return": "error",
      "no-duplicate-imports": "error",
      "no-inner-declarations": "error",
      "no-self-compare": "error",
      "no-unassigned-vars": "error",
      "no-unmodified-loop-condition": "error",
      "no-use-before-define": "error",
      "require-atomic-updates": "error",
    },
  },

  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },

  {
    files: ["**/*.json"],
    plugins: { json },
    language: "json/json",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.jsonc"],
    plugins: { json },
    language: "json/jsonc",
    extends: ["json/recommended"],
  },
  {
    files: ["**/*.json5"],
    plugins: { json },
    language: "json/json5",
    extends: ["json/recommended"],
  },

  globalIgnores([".package/*", "**/package-lock.json"]),
]);
