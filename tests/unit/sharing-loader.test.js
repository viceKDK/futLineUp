import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Script, runInNewContext } from "node:vm";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { nativeEntrySource } from "../../scripts/native-entry.mjs";
import { clientEntries } from "../../scripts/client-entries.mjs";
import { nativeModules } from "../../scripts/source-files.mjs";

const ROOT = new URL("../../", import.meta.url);

test("sharing has an ESM source and a reproducible loader for the existing classic HTML tag", async () => {
  assert.equal(clientEntries["page-share"], "src/app/mount-share.js");
  const source = nativeEntrySource(clientEntries["page-share"], {
    targetId: "page-share",
  });
  assert.equal(
    await readFile(new URL("compiled/page-share.js", ROOT), "utf8"),
    source,
  );
  assert.doesNotThrow(() => new Script(source));
  const esm = nativeEntrySource("src/app/legacy-bridge.js", {
    moduleTag: true,
  });
  assert.match(esm, /import "\.\.\/src\/app\/legacy-bridge.js";/);
  assert.throws(() => new Script(esm), /import/);
  assert.throws(() => nativeEntrySource("../../outside.js"), /Ruta/);
  assert.doesNotThrow(
    () => new Script(nativeEntrySource("src/app/mount-share.js")),
  );
});

test("every sharing module is in the offline inventory, including presentation imports", async () => {
  const context = { self: {} };
  runInNewContext(
    await readFile(new URL("compiled/module-precache.js", ROOT), "utf8"),
    context,
  );
  const expected = (await nativeModules(fileURLToPath(ROOT))).filter(
    (file) =>
      file.startsWith("src/features/sharing/") ||
      file === "src/app/mount-share.js" ||
      file === "src/shared/domain/civil-date.js",
  );
  for (const file of expected)
    assert.ok(context.self.FC_MODULE_PRECACHE.includes(`./${file}`), file);
});

test("coverage inventory includes every sharing core module, even one without dedicated assertions", async () => {
  const files = (await nativeModules(fileURLToPath(ROOT))).filter(
    (file) =>
      /^src\/features\/sharing\/(domain|application|infrastructure)\//.test(
        file,
      ) || file === "src/shared/domain/civil-date.js",
  );
  assert.ok(files.length >= 9);
  for (const file of files)
    await import(pathToFileURL(resolve(fileURLToPath(ROOT), file)).href);
});

test("native startup waits for runtime and classic deferred components", async () => {
  const { startSharing } = await import("../../src/app/mount-share.js");
  let listener,
    mounted = 0;
  const target = {
    document: {
      readyState: "interactive",
      addEventListener(name, callback, options) {
        assert.equal(name, "DOMContentLoaded");
        assert.equal(options.once, true);
        listener = callback;
      },
    },
  };
  const mount = (actual) => {
    assert.strictEqual(actual, target);
    mounted++;
  };
  startSharing(target, mount);
  assert.equal(mounted, 0);
  Object.assign(target, {
    fcRuntime: { snapshots: {} },
    React: {},
    Pitch() {},
    Kit() {},
    Icon() {},
    mountPage() {},
    useStore() {},
  });
  listener();
  assert.equal(mounted, 1);
  startSharing(target, mount);
  assert.equal(mounted, 2);
});

test("native startup shows initialization errors rather than a silent empty page", async () => {
  const { startSharing } = await import("../../src/app/mount-share.js");
  const errors = [],
    attributes = [];
  const root = {
    setAttribute: (...args) => attributes.push(args),
    textContent: "",
  };
  const target = {
    document: { readyState: "complete", getElementById: () => root },
    console: { error: (...args) => errors.push(args) },
  };
  startSharing(target, () => assert.fail("Dependencies are missing"));
  assert.equal(errors.length, 1);
  assert.deepEqual(attributes, [["role", "alert"]]);
  assert.match(root.textContent, /Recargá/);
  Object.assign(target, {
    fcRuntime: { snapshots: {} },
    React: {},
    Pitch() {},
    Kit() {},
    Icon() {},
    mountPage() {},
    useStore() {},
  });
  target.document.getElementById = () => null;
  startSharing(target, () => {
    throw Error("render failed");
  });
  assert.equal(errors.length, 2);
});
