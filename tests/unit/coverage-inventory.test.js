import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { nativeModules, isCoreModule } from "../../scripts/source-files.mjs";
// Node only reports loaded modules. Import the ENTIRE measured scope so a new,
// untested file lowers coverage instead of disappearing from the denominator.
const root = fileURLToPath(new URL("../../", import.meta.url));
test("coverage inventory imports every core module, even without a dedicated test", async () => {
  const files = (await nativeModules(root)).filter(isCoreModule);
  assert.ok(files.length >= 10);
  for (const file of files)
    await import(pathToFileURL(resolve(root, file)).href);
});
