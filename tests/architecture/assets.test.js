import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { nativeModules } from "../../scripts/source-files.mjs";

test("offline inventory contains every native source module", async () => {
  const context = { self: {} };
  runInNewContext(await readFile("compiled/module-precache.js", "utf8"), context);
  const actual = Array.from(context.self.FC_MODULE_PRECACHE);
  assert.deepEqual(actual, (await nativeModules(process.cwd())).map((file) => `./${file}`));
  assert.equal(actual.length, new Set(actual).size);
});
test("classic consumers are deferred after the native entry", async () => {
  const html = await readFile("futbolClub.html", "utf8");
  const scripts = [...html.matchAll(/<script\b([^>]*)>/g)].map((match) => match[1]);
  const index = scripts.findIndex((attrs) => attrs.includes('src="compiled/data.js"'));
  assert.ok(index >= 0);
  assert.match(scripts[index], /type="module"/);
  for (const attrs of scripts.slice(index + 1)) assert.match(attrs, /\bdefer\b/);
});
