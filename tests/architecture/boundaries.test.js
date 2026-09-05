import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { nativeModules } from "../../scripts/source-files.mjs";
import { inspectArchitecture } from "../../scripts/architecture-policy.mjs";
const root = fileURLToPath(new URL("../../", import.meta.url));
test("production ES modules respect dependency direction and have no cycles", async () => {
  const files = await nativeModules(root);
  const sources = new Map(await Promise.all(files.map(async (file) => [file, await readFile(new URL("../../" + file, import.meta.url), "utf8")])));
  assert.deepEqual(inspectArchitecture(sources), []);
});
test("the guard rejects domain -> infrastructure, broken imports and cycles", () => {
  const sources = new Map([
    [
      "src/features/a/domain/a.js", 'import "../../../b/infrastructure/b.js"; import "./missing.js";'
    ],
    ["src/b/infrastructure/b.js", 'import "../../features/a/domain/a.js";'],
  ]);
  const errors = inspectArchitecture(sources).join("\n");
  assert.match(errors, /domain no puede depender/);
  assert.match(errors, /inexistente/);
  assert.match(errors, /circular/);
});
test("the guard rejects bare packages and feature coupling in shared", () => {
  const errors = inspectArchitecture(new Map([
    ["src/shared/domain/a.js", 'import "react"; import "../../features/a/domain/b.js";'],
    ["src/features/a/domain/b.js", "export const x = 1;"],
  ])).join("\n");
  assert.match(errors, /externa/);
  assert.match(errors, /shared no puede/);
});
test("comments and string literals are not mistaken for dependencies", () => {
  assert.deepEqual(inspectArchitecture(new Map([
    [
      "src/shared/domain/a.js", `// import "react";\nexport const text = 'import "missing";';`
    ]
  ])), []);
});
