import globals from "globals";

const safetyRules = {
  "constructor-super": "error", "for-direction": "error", "getter-return": "error",
  "no-async-promise-executor": "error", "no-constant-binary-expression": "error",
  "no-dupe-args": "error", "no-dupe-class-members": "error", "no-dupe-else-if": "error",
  "no-dupe-keys": "error", "no-duplicate-case": "error", "no-eval": "error",
  "no-ex-assign": "error", "no-func-assign": "error", "no-implied-eval": "error",
  "no-new-func": "error", "no-obj-calls": "error", "no-prototype-builtins": "error",
  "no-self-assign": "error", "no-sparse-arrays": "error", "no-unexpected-multiline": "error",
  "no-unreachable": "error", "no-unreachable-loop": "error", "no-unsafe-finally": "error",
  "no-unsafe-negation": "error", "no-unsafe-optional-chaining": "error",
  "use-isnan": "error", "valid-typeof": "error",
};
export default [
  { ignores: ["node_modules/**", ".dist/**", "test-results/**", "screenshots/**", "marketing/**", "coverage/**", "compiled/**"] },
  {
    files: ["src/**/*.{js,jsx}", "service-worker.js"],
    languageOptions: {
      ecmaVersion: "latest", sourceType: "script",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.serviceworker },
    },
    rules: safetyRules,
  },
  {
    files: ["src/app/**/*.js", "src/shared/**/*.js", "src/features/**/*.js"],
    languageOptions: { sourceType: "module" },
    rules: {
      "no-undef": "error", "no-var": "error", "prefer-const": "error",
      "eqeqeq": ["error", "smart"],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["src/**/domain/**/*.js", "src/**/application/**/*.js"],
    rules: {
      "no-restricted-globals": ["error", "window", "document", "localStorage", "sessionStorage", "fetch", "navigator", "indexedDB", "React", "ReactDOM"],
    },
  },
  {
    files: ["tests/**/*.js", "scripts/**/*.mjs", "playwright.config.js", "eslint.config.js"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", globals: globals.node },
    rules: safetyRules,
  },
];
