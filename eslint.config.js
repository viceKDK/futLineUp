import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      ".dist/**",
      "test-results/**",
      "screenshots/**",
      "marketing/**",
    ],
  },
  {
    files: ["src/**/*.{js,jsx}", "service-worker.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.serviceworker },
    },
    rules: {
      "constructor-super": "error",
      "for-direction": "error",
      "getter-return": "error",
      "no-async-promise-executor": "error",
      "no-constant-binary-expression": "error",
      "no-dupe-args": "error",
      "no-dupe-class-members": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-eval": "error",
      "no-ex-assign": "error",
      "no-func-assign": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-obj-calls": "error",
      "no-prototype-builtins": "error",
      "no-self-assign": "error",
      "no-sparse-arrays": "error",
      "no-unexpected-multiline": "error",
      "no-unreachable": "error",
      "no-unreachable-loop": "error",
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
    },
  },
  {
    files: [
      "tests/**/*.js",
      "scripts/**/*.mjs",
      "playwright.config.js",
      "eslint.config.js",
    ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
    },
  },
];
