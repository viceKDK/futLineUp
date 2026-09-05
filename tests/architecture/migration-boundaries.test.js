import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { nativeModules } from "../../scripts/source-files.mjs";

test("domain/application modules never touch browser or vendor globals", async () => {
  const forbidden = /\b(?:window|document|localStorage|sessionStorage|indexedDB|navigator|React|ReactDOM|supabase)\b/;
  for (const file of (await nativeModules(process.cwd())).filter((path) => /\/(?:domain|application)\//.test(path))) {
    const source = await readFile(file, "utf8");
    assert.doesNotMatch(source, forbidden, file);
  }
});

test("legacy bridge is the only native module allowed to publish fc feature facades", async () => {
  for (const file of await nativeModules(process.cwd())) {
    const source = await readFile(file, "utf8");
    if (file === "src/app/legacy-bridge.js") continue;
    assert.doesNotMatch(source, /\bfc(?:League|Lineup|CoachDomain|DrawDomain|TeamsDomain|BackupFactories|CloudFactories)\s*[:=]/, file);
  }
});

test("new core modules stay comfortably below 300 lines", async () => {
  for (const file of (await nativeModules(process.cwd())).filter((path) => /\/(?:domain|application|infrastructure)\//.test(path))) {
    const lines = (await readFile(file, "utf8")).split(/\r?\n/).length;
    assert.ok(lines <= 300, `${file} tiene ${lines} líneas`);
  }
});
