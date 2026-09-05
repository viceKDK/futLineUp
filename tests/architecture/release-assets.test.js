import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { collectReleaseFiles, releaseRoots } from "../../scripts/release-files.mjs";

test("release contains native runtime modules without private local configuration", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "fut-release-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  async function write(path, value = "") {
    const absolute = join(root, path);
    await mkdir(dirname(absolute), { recursive: true });
    await writeFile(absolute, value);
  }
  const directories = new Set(["compiled", "styles", "vendor", "icons"]);
  for (const path of releaseRoots) {
    if (directories.has(path)) await write(`${path}/asset.js`);
    else await write(path);
  }
  const modules = [
    "src/app/legacy-bridge.js",
    "src/features/backup/application/backup-service.js",
    "src/shared/domain/nested/new-policy.js",
  ];
  for (const path of modules) await write(path, "export const value = 1;");
  await write("src/local-config.js", "private configuration");
  await write("src/features/backup/presentation/page.jsx", "legacy source");
  const actual = await collectReleaseFiles(root);
  for (const path of modules) assert.ok(actual.includes(path), path);
  assert.ok(actual.includes("compiled/asset.js"));
  assert.ok(actual.includes("src/local-config.example.js"));
  assert.ok(!actual.includes("src/local-config.js"));
  assert.ok(!actual.some((path) => path.endsWith(".jsx")));
  assert.deepEqual(actual, [...new Set(actual)].sort());
});
